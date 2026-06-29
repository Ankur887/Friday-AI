"""
interview.py — FastAPI router for the AI Interview Simulator
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from services.interview_service import (
    generate_first_question,
    evaluate_and_continue,
    generate_session_report,
    get_supported_companies,
    get_interview_rounds,
)
from services.voice_service import analyze_voice_metrics

router = APIRouter(prefix="/interview", tags=["interview"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    company:       str           = "Google"
    role:          str           = "Software Engineer"
    level:         str           = "Mid-level"
    stack:         str           = ""
    difficulty:    str           = "Medium"
    language:      str           = "en"
    resume_text:   Optional[str] = None
    github_url:    Optional[str] = None
    linkedin_url:  Optional[str] = None
    portfolio_url: Optional[str] = None
    rounds:        Optional[List[str]] = None  # override auto-selected rounds

class AnswerRequest(BaseModel):
    session_id:          str
    answer:              str
    session:             dict  # full session state (managed client-side)
    answer_duration_sec: float = 30.0

class EndRequest(BaseModel):
    session_id: str
    session:    dict

class VoiceAnalysisRequest(BaseModel):
    transcript:       str
    duration_seconds: float = 60.0


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/start")
async def start_interview(req: InterviewStartRequest):
    """
    Initialise a new interview session.
    Returns the session config + first interviewer message.
    """
    try:
        rounds = req.rounds or get_interview_rounds(req.role)

        session = {
            "company":       req.company,
            "role":          req.role,
            "level":         req.level,
            "stack":         req.stack,
            "difficulty":    req.difficulty,
            "language":      req.language,
            "resume_text":   req.resume_text or "",
            "current_round": rounds[0] if rounds else "recruiter",
            "rounds":        rounds,
            "round_index":   0,
            "messages":      [],
            "round_scores":  {},
            "completed_rounds": [],
        }

        first_message = generate_first_question(session)

        session["messages"].append({
            "role":    "assistant",
            "content": first_message,
        })

        return {
            "session":       session,
            "first_message": first_message,
            "rounds":        rounds,
            "current_round": rounds[0],
            "round_number":  1,
            "total_rounds":  len(rounds),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/answer")
async def submit_answer(req: AnswerRequest):
    """
    Submit candidate answer, get AI evaluation + next question.
    """
    try:
        session = req.session
        session["messages"].append({
            "role":    "user",
            "content": req.answer,
        })

        result = evaluate_and_continue(session, req.answer)

        # Voice analysis on every answer
        voice = analyze_voice_metrics(req.answer, req.answer_duration_sec)

        # Append AI response to session
        session["messages"].append({
            "role":    "assistant",
            "content": result["next_message"],
        })

        # Track score for current round
        current_round = session.get("current_round", "behavioral")
        if current_round not in session.get("round_scores", {}):
            session.setdefault("round_scores", {})[current_round] = []
        session["round_scores"][current_round].append(result["score"])

        # Check if we should advance to next round
        should_advance = result.get("advance_round", False)
        round_complete = result.get("round_complete", False)

        return {
            "next_message":  result["next_message"],
            "score":         result["score"],
            "feedback":      result["feedback"],
            "round_complete": round_complete,
            "advance_round": should_advance,
            "session":       session,
            "voice_metrics": voice,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/next-round")
async def advance_round(req: EndRequest):
    """Advance to the next interview round."""
    try:
        session     = req.session
        rounds      = session.get("rounds", [])
        round_index = session.get("round_index", 0) + 1

        if round_index >= len(rounds):
            return {"done": True, "session": session}

        session["round_index"]   = round_index
        session["current_round"] = rounds[round_index]
        session.setdefault("completed_rounds", []).append(rounds[round_index - 1])

        first_q = generate_first_question(session)
        session["messages"].append({"role": "assistant", "content": first_q})

        return {
            "done":          False,
            "next_question": first_q,
            "current_round": rounds[round_index],
            "round_number":  round_index + 1,
            "total_rounds":  len(rounds),
            "session":       session,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/end")
async def end_interview(req: EndRequest):
    """Generate the final interview report."""
    try:
        report = generate_session_report(req.session)
        return {
            "report":  report,
            "session": req.session,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-voice")
async def analyze_voice(req: VoiceAnalysisRequest):
    """Analyse a speech transcript for communication quality."""
    return analyze_voice_metrics(req.transcript, req.duration_seconds)


@router.get("/companies")
async def list_companies():
    return {"companies": get_supported_companies()}


@router.get("/rounds")
async def list_rounds(role: str = "Software Engineer"):
    return {"rounds": get_interview_rounds(role)}


# ── Integrity Score Calculator (simple formula endpoint) ─────────────────────

class IntegrityScoreRequest(BaseModel):
    answer_quality: str   # 'good' | 'weak' | 'poor'
    company_tier:   str   # 'tier1' | 'tier2' | 'tier3'
    position_level: str   # 'intern' | 'junior' | 'mid' | 'senior' | 'staff'


@router.post("/score")
async def calculate_integrity_gain(req: IntegrityScoreRequest):
    """Calculate integrity score gain for a single answer (simple formula)."""
    base        = 10.0
    tier_map    = {"tier1": 0.5, "tier2": 0.75, "tier3": 1.0}
    pos_map     = {"intern": 1.0, "junior": 0.85, "mid": 0.70, "senior": 0.55, "staff": 0.40}
    quality_map = {"excellent": 1.0, "good": 0.75, "average": 0.50, "weak": 0.25, "no_answer": 0.0}

    gain = round(
        base
        * tier_map.get(req.company_tier, 1.0)
        * pos_map.get(req.position_level, 0.7)
        * quality_map.get(req.answer_quality, 0.5),
        2,
    )
    return {"gain": gain}


# ── Answer Quality Evaluator ──────────────────────────────────────────────────

import os as _os

try:
    from groq import Groq as _GroqClient
    _groq = _GroqClient(api_key=_os.getenv("GROQ_API_KEY", ""))
except Exception:
    _groq = None


class AnswerEvalRequest(BaseModel):
    question: str
    answer:   str


@router.post("/evaluate-answer")
async def evaluate_answer(req: AnswerEvalRequest):
    """
    Classify the quality of a candidate's answer using Groq LLM.
    Returns one of: excellent | good | average | weak | no_answer
    """
    if _groq is None:
        return {"quality": "average"}

    prompt = (
        f"You are an expert technical interviewer.\n"
        f"The interview question was: \"{req.question}\"\n"
        f"The candidate answered: \"{req.answer}\"\n\n"
        f"Rate the answer quality as EXACTLY ONE word from this list:\n"
        f"excellent, good, average, weak, no_answer\n\n"
        f"Criteria:\n"
        f"- excellent: Complete, accurate, shows depth and pattern recognition\n"
        f"- good: Mostly correct, minor gaps, good structure\n"
        f"- average: Partially correct, missing key points\n"
        f"- weak: Largely incorrect or very shallow\n"
        f"- no_answer: Candidate said nothing relevant or 'I don't know'\n\n"
        f"Respond with ONLY the single quality word. Nothing else."
    )

    try:
        resp    = _groq.chat.completions.create(
            model    = "llama3-8b-8192",
            messages = [{"role": "user", "content": prompt}],
            max_tokens  = 5,
            temperature = 0.1,
        )
        quality = resp.choices[0].message.content.strip().lower()
        if quality not in {"excellent", "good", "average", "weak", "no_answer"}:
            quality = "average"
    except Exception as exc:
        print(f"[evaluate-answer] Groq error: {exc}")
        quality = "average"

    return {"quality": quality}


# ── Final Interview Summary ───────────────────────────────────────────────────

class FinalSummaryRequest(BaseModel):
    company:           str
    role:              str
    position:          str
    round:             str           = ""
    integrity_score:   float         = 0.0
    question_count:    int           = 0
    quality_breakdown: dict          = {}   # {excellent:N, good:N, average:N, weak:N, no_answer:N}


@router.post("/final-summary")
async def generate_final_summary(req: FinalSummaryRequest):
    """
    Generate a 3-sentence interview performance summary using Groq LLM.
    Returns { summary: str }
    """
    if _groq is None:
        return {
            "summary": (
                f"You completed your {req.role} interview at {req.company} "
                f"with an integrity score of {req.integrity_score:.0f}/100. "
                f"Keep practising to improve your performance."
            )
        }

    bd_str = ", ".join(
        f"{k}: {v}"
        for k, v in req.quality_breakdown.items()
        if v > 0
    ) or "no answers recorded"

    prompt = (
        f"Generate a 3-sentence interview performance summary for:\n"
        f"Company: {req.company}  |  Role: {req.role}  |  Level: {req.position}\n"
        f"Round: {req.round or 'General'}  |  Final Score: {req.integrity_score:.1f}/100\n"
        f"Answers given: {req.question_count}  |  Quality breakdown: {bd_str}\n\n"
        f"Rules:\n"
        f"- Be honest and specific. Mention both strengths and areas to improve.\n"
        f"- Do NOT use bullet points. Write a plain paragraph only.\n"
        f"- Exactly 3 sentences. No more, no less.\n"
        f"- Start with: 'Based on your performance in this {req.company} {req.role} ({req.position}) interview...'"
    )

    try:
        resp    = _groq.chat.completions.create(
            model    = "llama3-8b-8192",
            messages = [{"role": "user", "content": prompt}],
            max_tokens  = 200,
            temperature = 0.6,
        )
        summary = resp.choices[0].message.content.strip()
    except Exception as exc:
        print(f"[final-summary] Groq error: {exc}")
        summary = (
            f"Based on your performance in this {req.company} {req.role} ({req.position}) interview, "
            f"you scored {req.integrity_score:.0f}/100. "
            f"Continue practising to strengthen your technical and communication skills."
        )

    return {"summary": summary}

