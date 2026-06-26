from fastapi import FastAPI, Depends, Response, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from groq import Groq, RateLimitError, NotFoundError, APIError
from routes.interview import router as interview_router
from routes.resume import router as resume_router
from routes.career import router as career_router
from dotenv import load_dotenv
from crud.conversation import (
    create_conversation, get_conversations, delete_conversation,
    get_conversation_by_id,
)
from crud.message import create_message, get_messages
from crud.auth import (
    create_user, get_user_by_email, get_user_by_id,
    check_username_available, check_email_available,
    get_available_username, generate_otp,
    create_email_verification, verify_otp,
    save_refresh_token, get_refresh_token, delete_refresh_token,
    verify_password, update_last_login,
    get_user_by_identifier,
)
from utils.email_utils import send_otp_email, send_welcome_email
from typing import Optional
from utils.jwt_utils import create_access_token, create_refresh_token, decode_token
from utils.auth_middleware import get_current_user, get_optional_user
from fastapi import UploadFile, File
from database.models import Conversation, Message, User
from database.db import SessionLocal
from memory import (
    get_embedder, embed, get_store,
    store_memory,
    search_relevant_memories, store_user_fact, get_user_facts,
    extract_and_store_facts, build_memory_context,
)
import pypdf
import subprocess
import tempfile
import shutil
import sys
import os
import io
import re
import json
import base64
import logging


load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("LOADED MAIN.PY FROM:", __file__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Career OS routers ─────────────────────────────────────────────────────────
app.include_router(interview_router)
app.include_router(resume_router)
app.include_router(career_router)

import time as _time

# ── Health check endpoint — used by frontend for latency measurement ───────────
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": _time.time()}

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

BASE_SYSTEM_PROMPT = """You are Friday, a highly capable AI assistant. You communicate with the clarity, depth, and warmth of a knowledgeable expert who genuinely wants to help.

## How you respond

**Be direct.** Lead with the answer or the most useful insight. Don't open with filler phrases like "Great question!", "Certainly!", "Of course!", or "Absolutely!" — just respond.

**Match length to the question.** Short conversational questions get short, natural answers. Complex technical questions get thorough, well-structured responses. Never pad with unnecessary words.

**Use formatting when it genuinely helps.**
- Use **bold** to highlight the single most important term or concept in a section — not for decoration.
- Use bullet points or numbered lists only when the content is actually a list of distinct items. Avoid turning flowing explanations into fragmented bullets.
- Use headers (##) only for longer responses with clearly distinct sections.
- Use code blocks for all code, commands, file paths, and technical strings.

**Explain your reasoning.** For non-trivial questions, show your thinking briefly — not just the conclusion. This makes you more trustworthy and useful.

**Be honest about uncertainty.** If you're not sure, say so. Offer your best reasoning and flag what you don't know rather than confidently guessing.

**Tone:** Warm but professional. Conversational but precise. You're talking to a smart person — don't over-explain basics, but don't assume knowledge either. Adjust based on cues in their message.

**For technical topics:** Prefer concrete examples over abstract descriptions. Show, don't just tell.

**Never:**
- Repeat the user's question back to them
- Start with "I" as the first word
- End with hollow sign-offs like "I hope this helps!" or "Let me know if you need anything else!"
- Use excessive em-dashes or semicolons
- Break everything into bullets when prose would read better

You are Friday. Be excellent.

"""

# Maps the frontend's `prefs.language` codes to the full language name used
# in the system prompt. Add entries here if more languages are supported later.
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (Devanagari script)",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
}

REFRESH_TOKEN_COOKIE = "refresh_token"


# ══════════════════════════════════════════════════════════════════════════════
# AUTH SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    identifier: str
    password:   str

class SignUpStep1(BaseModel):
    first_name: str
    last_name:  str = ""

class SignUpStep3(BaseModel):
    email: str

class SignUpComplete(BaseModel):
    first_name: str
    last_name:  str = ""
    username:   str
    email:      str
    password:   str

class VerifyOTPRequest(BaseModel):
    user_id:  str
    otp_code: str

class ResendOTPRequest(BaseModel):
    user_id: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    user_id:      str
    otp_code:     str
    new_password: str

class DebugRequest(BaseModel):
    code:        str
    filename:    str = "main.py"
    language:    str = "python"
    breakpoints: list[int] = []


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/auth/check-username")
def check_username(username: str):
    available = check_username_available(username)
    return {"available": available, "username": username}


@app.post("/api/auth/check-email")
def check_email(req: SignUpStep3):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        return JSONResponse(status_code=400, content={"message": "Invalid email format"})
    available = check_email_available(email)
    if not available:
        return JSONResponse(status_code=409, content={"message": "Email already exists"})
    return {"message": "Email available"}


@app.post("/api/auth/suggest-username")
def suggest_username(req: SignUpStep1):
    username = get_available_username(req.first_name, req.last_name)
    return {"username": username}


@app.post("/api/auth/register")
def register(req: SignUpComplete, response: Response):
    if not req.first_name or len(req.first_name) < 2:
        return JSONResponse(status_code=400, content={"message": "First name must be at least 2 characters"})
    if len(req.password) < 8:
        return JSONResponse(status_code=400, content={"message": "Password must be at least 8 characters"})
    if not check_email_available(req.email):
        return JSONResponse(status_code=409, content={"message": "Email already exists"})
    if not check_username_available(req.username):
        return JSONResponse(status_code=409, content={"message": "Username already taken"})

    user = create_user(
        first_name=req.first_name,
        last_name=req.last_name,
        username=req.username,
        email=req.email,
        password=req.password,
    )

    otp = generate_otp()
    create_email_verification(str(user.id), otp)
    send_otp_email(user.email, otp, user.first_name)

    return {
        "user_id": str(user.id),
        "message": "OTP sent to your email",
        "email":   user.email,
    }


@app.post("/api/auth/verify-otp")
def verify_otp_route(req: VerifyOTPRequest, response: Response):
    success = verify_otp(req.user_id, req.otp_code)
    if not success:
        return JSONResponse(status_code=400, content={"message": "Invalid or expired OTP"})

    user          = get_user_by_id(req.user_id)
    access_token  = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    save_refresh_token(str(user.id), refresh_token)
    update_last_login(str(user.id))

    try:
        send_welcome_email(user.email, user.first_name, user.username)
    except Exception:
        pass

    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )
    return {
        "access_token": access_token,
        "user": _user_dict(user),
    }


@app.post("/api/auth/resend-otp")
def resend_otp(req: ResendOTPRequest):
    user = get_user_by_id(req.user_id)
    if not user:
        return JSONResponse(status_code=404, content={"message": "User not found"})
    otp = generate_otp()
    create_email_verification(str(user.id), otp)
    send_otp_email(user.email, otp, user.first_name)
    return {"message": "OTP resent"}


@app.post("/api/auth/login")
def login(req: LoginRequest, response: Response):
    user = get_user_by_identifier(req.identifier)
    if not user or not verify_password(req.password, user.password_hash):
        return JSONResponse(status_code=401, content={"message": "Invalid credentials"})

    if not user.email_verified:
        otp = generate_otp()
        create_email_verification(str(user.id), otp)
        send_otp_email(user.email, otp, user.first_name)
        return JSONResponse(status_code=403, content={
            "message": "Email not verified",
            "user_id": str(user.id),
        })

    access_token  = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    save_refresh_token(str(user.id), refresh_token)
    update_last_login(str(user.id))

    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )
    return {
        "access_token": access_token,
        "user": _user_dict(user),
    }


@app.post("/api/auth/refresh")
def refresh_token_route(request: Request, response: Response):
    token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if not token:
        return JSONResponse(status_code=401, content={"message": "No refresh token"})
    rt = get_refresh_token(token)
    if not rt:
        return JSONResponse(status_code=401, content={"message": "Invalid or expired refresh token"})
    user         = get_user_by_id(str(rt.user_id))
    access_token = create_access_token(str(user.id))
    return {"access_token": access_token, "user": _user_dict(user)}


@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if token:
        delete_refresh_token(token)
    response.delete_cookie(REFRESH_TOKEN_COOKIE)
    return {"message": "Logged out"}


@app.get("/api/auth/me")
def get_me(current_user=Depends(get_current_user)):
    return _user_dict(current_user)


@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    user = get_user_by_email(req.email)
    if not user:
        return {"message": "If that email exists, a reset code was sent"}
    otp = generate_otp()
    create_email_verification(str(user.id), otp)
    send_otp_email(user.email, otp, user.first_name)
    return {"message": "If that email exists, a reset code was sent", "user_id": str(user.id)}


@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    success = verify_otp(req.user_id, req.otp_code)
    if not success:
        return JSONResponse(status_code=400, content={"message": "Invalid or expired OTP"})
    from crud.auth import hash_password
    db = SessionLocal()
    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        user.password_hash = hash_password(req.new_password)
        db.commit()
    db.close()
    return {"message": "Password reset successful"}


def _user_dict(user) -> dict:
    return {
        "id":                str(user.id),
        "first_name":        user.first_name,
        "last_name":         user.last_name or "",
        "username":          user.username,
        "email":             user.email,
        "avatar_url":        user.avatar_url or "",
        "subscription_type": user.subscription_type,
        "role":              user.role,
        "email_verified":    user.email_verified,
    }


# ══════════════════════════════════════════════════════════════════════════════
# CHAT & APP SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class CodeRequest(BaseModel):
    code:     str
    language: str = "python"
    filename: str = "main.py"

class ChatRequest(BaseModel):
    conversation_id: str
    message:         str
    response_style:  str = "balanced"
    language:        str = "en"
    file_content:    str | None = None
    file_name:       str | None = None
    file_type:       Optional[str] = None

class ConversationRequest(BaseModel):
    title: str

class UpdateConversationRequest(BaseModel):
    title: str

class MessageRequest(BaseModel):
    conversation_id: str
    role:            str
    content:         str

class AgentEditRequest(BaseModel):
    instruction:  str
    current_file: str | None = None
    current_code: str | None = None
    context:      str | None = None


STYLE_HINTS = {
    "concise":  "Keep your response SHORT and to the point. No elaboration unless critical.",
    "balanced": "",
    "detailed": "Give a THOROUGH, in-depth response. Cover edge cases, examples, and nuance.",
}


# ══════════════════════════════════════════════════════════════════════════════
# CHAT ROUTE
# ══════════════════════════════════════════════════════════════════════════════

def extract_pdf_text(b64_data: str) -> str:
    """
    Decode a base64-encoded PDF and extract its text using pypdf.
    Returns extracted text, or raises ValueError on failure.
    """
    from pypdf import PdfReader

    pdf_bytes = base64.b64decode(b64_data)
    reader    = PdfReader(io.BytesIO(pdf_bytes))

    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(f"[Page {i + 1}]\n{text.strip()}")

    if not pages:
        raise ValueError("Could not extract any text from this PDF. It may be scanned/image-only.")

    return "\n\n".join(pages)


@app.post("/chat")
async def chat(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_optional_user),
):
    if current_user:
        conv = get_conversation_by_id(req.conversation_id)
        if not conv:
            return JSONResponse(status_code=404, content={"response": "Conversation not found"})
        if conv.user_id and str(conv.user_id) != str(current_user.id):
            return JSONResponse(status_code=403, content={"response": "Access denied"})

    try:
        memory_block = ""
        user_id      = str(current_user.id) if current_user else None

        if user_id:
            try:
                memory_block = build_memory_context(user_id, req.message)
            except Exception as mem_err:
                logger.warning("Memory retrieval failed: %s", mem_err)

        style_hint   = STYLE_HINTS.get(req.response_style, "")
        system_parts = [BASE_SYSTEM_PROMPT]

        lang_name = LANGUAGE_NAMES.get(req.language, "English")
        system_parts.append(
            f"\n## Response Language\nRespond ENTIRELY in {lang_name}, regardless of "
            f"what language earlier messages in this conversation were written in. "
            f"This reflects the user's CURRENT language setting and always takes "
            f"priority over the language used in conversation history.\n"
        )

        if style_hint:
            system_parts.append(f"\n## Response Style\n{style_hint}\n")
        if memory_block:
            system_parts.append(f"\n{memory_block}")

        system_prompt = "\n".join(system_parts)

        # ── Resolve file content ──────────────────────────────────────────────
        resolved_content: Optional[str] = None
        pdf_page_count: Optional[int]   = None

        if req.file_content:
            if getattr(req, "file_type", None) == "pdf":
                try:
                    resolved_content = extract_pdf_text(req.file_content)

                    from pypdf import PdfReader
                    pdf_bytes      = base64.b64decode(req.file_content)
                    pdf_page_count = len(PdfReader(io.BytesIO(pdf_bytes)).pages)
                    logger.info(
                        "PDF '%s' extracted: %d pages, %d chars",
                        req.file_name, pdf_page_count, len(resolved_content),
                    )
                except Exception as pdf_err:
                    logger.warning("PDF extraction failed: %s", pdf_err)
                    return JSONResponse(
                        status_code=422,
                        content={"response": f"⚠️ Could not read this PDF: {pdf_err}"},
                    )
            else:
                resolved_content = req.file_content

        # ── Build enriched message ────────────────────────────────────────────
        if resolved_content:
            fname   = req.file_name or "uploaded file"
            trimmed = resolved_content[:14_000]
            tail    = "\n\n[... content truncated due to length ...]" \
                      if len(resolved_content) > 14_000 else ""

            page_note = f" ({pdf_page_count} pages)" if pdf_page_count else ""

            if req.message.strip():
                enriched_message = (
                    f'The user uploaded a file: "{fname}"{page_note}\n\n'
                    f"File contents:\n```\n{trimmed}{tail}\n```\n\n"
                    f"User request: {req.message}"
                )
            else:
                enriched_message = (
                    f'The user uploaded a file: "{fname}"{page_note}\n\n'
                    f"File contents:\n```\n{trimmed}{tail}\n```\n\n"
                    f"Please do the following based on the file above:\n"
                    f"1. Write a clear, concise summary (3–5 sentences)\n"
                    f"2. List the key concepts or topics covered\n"
                    f"3. Highlight any important facts, figures, or conclusions\n"
                    f"4. Suggest 3 smart follow-up questions the user could ask"
                )
        else:
            enriched_message = req.message

        # ── Save + fetch history ──────────────────────────────────────────────
        create_message(req.conversation_id, "user", req.message)
        messages = get_messages(req.conversation_id)
        recent   = messages[-10:] if len(messages) > 10 else messages

        groq_messages = [{"role": "system", "content": system_prompt}]
        for msg in recent[:-1]:
            groq_messages.append({"role": msg.role, "content": msg.content})
        groq_messages.append({"role": "user", "content": enriched_message})

        # ── Call Groq ─────────────────────────────────────────────────────────
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
        )
        ai_reply = response.choices[0].message.content

        create_message(req.conversation_id, "assistant", ai_reply)

        if user_id:
            background_tasks.add_task(store_memory, user_id, req.conversation_id, req.message, ai_reply)
            background_tasks.add_task(extract_and_store_facts, user_id, req.message, client)

        return {"response": ai_reply}

    except RateLimitError:
        return JSONResponse(status_code=429, content={"response": "⚠️ Rate limit reached. Please wait a moment."})
    except NotFoundError:
        return JSONResponse(status_code=404, content={"response": "❌ Model not found."})
    except APIError as e:
        return JSONResponse(status_code=500, content={"response": f"API Error: {str(e)}"})
    except Exception as e:
        logger.exception("Unexpected error in /chat")
        return JSONResponse(status_code=500, content={"response": f"Server Error: {str(e)}"})


@app.post("/debug-analyze")
async def debug_analyze(req: DebugRequest):
    """
    AI-powered dry-run debugger.
    Traces execution step by step, finds bugs, and returns fixes.
    """
    bp_note = f"\nBreakpoints at lines: {req.breakpoints}" if req.breakpoints else ""

    prompt = f"""You are an expert debugger. Perform a thorough dry-run analysis of this {req.language} code.{bp_note}

FILE: {req.filename}
```{req.language}
{req.code}
```

Your task:
1. Trace execution step by step (every meaningful operation, loop iteration, function call, condition check)
2. Track variable states at each step
3. Identify ALL bugs, issues, code smells, edge cases, and performance problems
4. For each bug provide the exact fix
5. Produce the complete corrected file if there are any bugs

Respond ONLY with a valid JSON object. No markdown fences. No text outside the JSON. Schema:

{{
  "verdict": "one-sentence overall verdict",
  "hasBugs": true,
  "complexity": "O(n) or similar",
  "performance": "Good|Fair|Poor",
  "language": "{req.language}",
  "steps": [
    {{
      "title": "short step label",
      "line": 5,
      "status": "ok|warning|error|info",
      "description": "what happens at this step",
      "vars": {{"varName": "value"}},
      "output": "stdout at this step or null"
    }}
  ],
  "bugs": [
    {{
      "title": "short bug title",
      "severity": "critical|high|medium|low|info",
      "type": "LogicError|RuntimeError|TypeError|PerformanceIssue|CodeSmell|EdgeCase|SecurityIssue",
      "line": 12,
      "description": "detailed explanation",
      "buggyCode": "exact problematic snippet",
      "fixedCode": "corrected snippet",
      "explanation": "why this fix works",
      "fullFixedFile": "complete corrected file as string"
    }}
  ],
  "fullFixedFile": "complete corrected file as string, or null if no bugs",
  "summary": "2-3 sentence paragraph on code quality and recommendations"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert code debugger. Always respond with valid JSON only, no markdown fences, no extra text."},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=4000,
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"```$", "", raw).strip()

        try:
            data = json.loads(raw)
            return data
        except json.JSONDecodeError:
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                return json.loads(match.group(0))
            raise ValueError("Model returned non-JSON response")

    except RateLimitError:
        return JSONResponse(status_code=429, content={"error": "Rate limit reached. Please wait a moment."})
    except Exception as e:
        logger.exception("Error in /debug-analyze")
        return JSONResponse(status_code=500, content={"error": str(e)})


# ══════════════════════════════════════════════════════════════════════════════
# CODE EXECUTION  ← supports 25+ languages
# ══════════════════════════════════════════════════════════════════════════════

LANG_CONFIGS = {
    # ── Interpreted ───────────────────────────────────────────────────────────
    "python":     {"suffix": ".py",    "cmd": lambda p: [sys.executable, p]},
    "javascript": {"suffix": ".js",    "cmd": lambda p: (["node", p]                if shutil.which("node")    else None)},
    "typescript": {"suffix": ".ts",    "cmd": lambda p: (["npx","ts-node","--skip-project", p] if shutil.which("npx") else None)},
    "ruby":       {"suffix": ".rb",    "cmd": lambda p: (["ruby", p]                if shutil.which("ruby")    else None)},
    "perl":       {"suffix": ".pl",    "cmd": lambda p: (["perl", p]                if shutil.which("perl")    else None)},
    "php":        {"suffix": ".php",   "cmd": lambda p: (["php", p]                 if shutil.which("php")     else None)},
    "lua":        {"suffix": ".lua",   "cmd": lambda p: (["lua", p]                 if shutil.which("lua")     else None)},
    "r":          {"suffix": ".r",     "cmd": lambda p: (["Rscript", p]             if shutil.which("Rscript") else None)},
    "shell":      {"suffix": ".sh",    "cmd": lambda p: (["bash", p]                if shutil.which("bash")    else None)},
    "swift":      {"suffix": ".swift", "cmd": lambda p: (["swift", p]               if shutil.which("swift")   else None)},
    "go":         {"suffix": ".go",    "cmd": lambda p: (["go", "run", p]           if shutil.which("go")      else None)},
    "kotlin":     {"suffix": ".kts",   "cmd": lambda p: (["kotlinc", "-script", p]  if shutil.which("kotlinc") else None)},
    "elixir":     {"suffix": ".exs",   "cmd": lambda p: (["elixir", p]              if shutil.which("elixir")  else None)},
    "dart":       {"suffix": ".dart",  "cmd": lambda p: (["dart", "run", p]         if shutil.which("dart")    else None)},
    "haskell":    {"suffix": ".hs",    "cmd": lambda p: (["runghc", p]              if shutil.which("runghc")  else None)},
    "scala":      {"suffix": ".sc",    "cmd": lambda p: (["scala", p]               if shutil.which("scala")   else None)},
    # ── Compiled ──────────────────────────────────────────────────────────────
    "c":          {"suffix": ".c",     "compiled": True, "compiler": "gcc",   "flags": ["-lm"], "std": []},
    "cpp":        {"suffix": ".cpp",   "compiled": True, "compiler": "g++",   "flags": ["-lm"], "std": ["-std=c++17"]},
    "rust":       {"suffix": ".rs",    "compiled": True, "compiler": "rustc", "flags": [],       "std": []},
    "java":       {"suffix": ".java",  "java": True},
    "csharp":     {"suffix": ".cs",    "cmd": lambda p: (["dotnet-script", p] if shutil.which("dotnet-script") else None)},
}


@app.post("/run-code")
async def run_code(req: CodeRequest):
    lang = req.language.lower()

    if lang not in LANG_CONFIGS:
        return JSONResponse(
            status_code=400,
            content={"error": f"Language '{lang}' is not supported for execution on this server."}
        )

    cfg = LANG_CONFIGS[lang]

    # ── Java ──────────────────────────────────────────────────────────────────
    if cfg.get("java"):
        if not shutil.which("javac") or not shutil.which("java"):
            return JSONResponse(status_code=400, content={"error": "Java (javac/java) not installed on server."})
        m         = re.search(r"public\s+class\s+(\w+)", req.code)
        classname = m.group(1) if m else "Main"
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                src = os.path.join(tmpdir, f"{classname}.java")
                with open(src, "w", encoding="utf-8") as f:
                    f.write(req.code)
                comp = subprocess.run(
                    ["javac", src], capture_output=True, text=True, timeout=20, cwd=tmpdir
                )
                if comp.returncode != 0:
                    return {"error": comp.stderr}
                result = subprocess.run(
                    ["java", "-cp", tmpdir, classname], capture_output=True, text=True, timeout=10
                )
                return {"output": result.stdout} if result.returncode == 0 else {"error": result.stderr}
        except subprocess.TimeoutExpired:
            return JSONResponse(status_code=408, content={"error": "⏱ Execution timed out."})
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

    # ── Compiled (C, C++, Rust) ───────────────────────────────────────────────
    if cfg.get("compiled"):
        compiler = cfg["compiler"]
        if not shutil.which(compiler):
            return JSONResponse(status_code=400, content={"error": f"'{compiler}' not installed on server."})
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                src = os.path.join(tmpdir, f"prog{cfg['suffix']}")
                out = os.path.join(tmpdir, "prog")
                with open(src, "w", encoding="utf-8") as f:
                    f.write(req.code)
                compile_cmd = [compiler, src, "-o", out] + cfg.get("std", []) + cfg.get("flags", [])
                comp = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=20)
                if comp.returncode != 0:
                    return {"error": comp.stderr}
                result = subprocess.run([out], capture_output=True, text=True, timeout=10)
                return {"output": result.stdout} if result.returncode == 0 else {"error": result.stderr}
        except subprocess.TimeoutExpired:
            return JSONResponse(status_code=408, content={"error": "⏱ Compilation or execution timed out."})
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

    cmd_fn = cfg.get("cmd")
    if cmd_fn is None:
        return JSONResponse(status_code=400, content={"error": f"No executor configured for '{lang}'."})

    suffix   = cfg["suffix"]
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=suffix, delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(req.code)
            tmp_path = tmp.name

        cmd = cmd_fn(tmp_path)
        if cmd is None:
            return JSONResponse(
                status_code=400,
                content={"error": f"Runtime for '{lang}' is not installed on this server."}
            )

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return {"output": result.stdout or "(program produced no output)"}
        else:
            return {"error": result.stderr or result.stdout}

    except subprocess.TimeoutExpired:
        return JSONResponse(status_code=408, content={"error": "⏱ Execution timed out (10s limit)."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Server Error: {str(e)}"})
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


# ══════════════════════════════════════════════════════════════════════════════
# FILE UPLOAD  — supports PDF, DOCX, TXT, PY, JS, TS, CSV, MD
# Requires: pip install pypdf python-docx
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content  = await file.read()
    filename = file.filename.lower()
    try:
        if filename.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(content))
            text   = "\n".join(page.extract_text() or "" for page in reader.pages)
            return {"content": text, "file_type": "pdf"}

        elif filename.endswith(".docx"):
            try:
                from docx import Document
                doc  = Document(io.BytesIO(content))
                text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
                return {"content": text, "file_type": "docx"}
            except ImportError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "python-docx not installed. Run: pip install python-docx"}
                )

        elif filename.endswith((".txt", ".py", ".js", ".ts", ".csv", ".md")):
            return {"content": content.decode("utf-8"), "file_type": "text"}

        else:
            return JSONResponse(status_code=400, content={"error": "Unsupported file type"})

    except Exception as ex:
        return JSONResponse(status_code=500, content={"error": str(ex)})


# ══════════════════════════════════════════════════════════════════════════════
# CONVERSATION ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/conversation")
def new_conversation(req: ConversationRequest, current_user=Depends(get_optional_user)):
    if not current_user:
        return JSONResponse(status_code=401, content={"message": "Sign in to save your conversations"})
    conversation = create_conversation(req.title, user_id=str(current_user.id))
    return {"id": str(conversation.id), "title": conversation.title}


@app.get("/conversations")
def fetch_conversations(current_user=Depends(get_optional_user)):
    if not current_user:
        return []
    conversations = get_conversations(user_id=str(current_user.id))
    return [{"id": str(c.id), "title": c.title} for c in conversations]


@app.patch("/conversation/{conversation_id}")
def update_conversation(
    conversation_id: str,
    req: UpdateConversationRequest,
    current_user=Depends(get_optional_user),
):
    db   = SessionLocal()
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv:
        conv.title = req.title
        db.commit()
    db.close()
    return {"id": conversation_id, "title": req.title}


@app.delete("/conversation/{conversation_id}")
def remove_conversation(conversation_id: str, current_user=Depends(get_current_user)):
    conv = get_conversation_by_id(conversation_id)
    if not conv:
        return JSONResponse(status_code=404, content={"message": "Conversation not found"})
    if str(conv.user_id) != str(current_user.id):
        return JSONResponse(status_code=403, content={"message": "Access denied"})
    delete_conversation(conversation_id)
    return {"deleted": conversation_id}


@app.get("/conversation/{conversation_id}/messages")
def fetch_messages(conversation_id: str, current_user=Depends(get_optional_user)):
    conv = get_conversation_by_id(conversation_id)
    if not conv:
        return JSONResponse(status_code=404, content={"message": "Conversation not found"})
    if current_user and conv.user_id and str(conv.user_id) != str(current_user.id):
        return JSONResponse(status_code=403, content={"message": "Access denied"})
    messages = get_messages(conversation_id)
    return [
        {"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at}
        for m in messages
    ]


@app.post("/message")
def new_message(req: MessageRequest, current_user=Depends(get_optional_user)):
    if current_user:
        conv = get_conversation_by_id(req.conversation_id)
        if not conv:
            return JSONResponse(status_code=404, content={"message": "Conversation not found"})
        if conv.user_id and str(conv.user_id) != str(current_user.id):
            return JSONResponse(status_code=403, content={"message": "Access denied"})
    message = create_message(req.conversation_id, req.role, req.content)
    return {
        "id":              str(message.id),
        "conversation_id": str(message.conversation_id),
        "role":            message.role,
        "content":         message.content,
    }


# ══════════════════════════════════════════════════════════════════════════════
# AGENT EDIT
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/agent/edit")
async def agent_edit(req: AgentEditRequest, current_user=Depends(get_optional_user)):
    try:
        system = """You are Friday, an expert AI coding agent embedded in an IDE.

Your job is to edit code based on the user's instruction.

Rules:
- If the user asks you to edit code, return ONLY a JSON object like:
  {"edited_code": "...the full updated code...", "explanation": "what you changed and why"}
- If the user asks a question (not an edit), return:
  {"response": "your answer here"}
- Never return markdown fences around the JSON.
- Always return valid JSON.
- When editing, return the COMPLETE file content, not just the changed part.
- Keep the user's coding style and patterns.
- Add comments only where genuinely needed.
"""
        user_message = req.instruction
        if req.current_code and req.current_file:
            user_message += f"\n\nFile: {req.current_file}\n```\n{req.current_code}\n```"

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user_message},
            ],
            max_tokens=4000,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        try:
            data = json.loads(raw)
            return data
        except json.JSONDecodeError:
            return {"response": raw}

    except RateLimitError:
        return JSONResponse(status_code=429, content={"response": "⚠️ Rate limit reached."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"response": f"Error: {str(e)}"})