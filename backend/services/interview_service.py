"""
interview_service.py
--------------------
Business logic for the AI Interview Simulator.
Supports: Resume Screening, Behavioral, Coding, System Design,
          Debugging, Project Deep Dive, HR, AI/ML rounds.
"""
from .ai_orchestrator import call_ai, call_ai_json

# ── Company personas ───────────────────────────────────────────────────────────
COMPANY_PERSONAS = {
    "Google":     "a senior Google engineer. Focus on problem-solving, scalability, clean code, and CS fundamentals. Google values intellectual curiosity.",
    "Amazon":     "a senior Amazon interviewer. Apply the Leadership Principles (LP) heavily. Ask STAR-format behavioral questions that probe ownership, bias for action, customer obsession.",
    "Meta":       "a senior Meta engineer. Focus on product thinking, speed of execution, moving fast, impact at scale.",
    "Microsoft":  "a senior Microsoft interviewer. Balance technical depth with growth mindset. Ask about collaboration, learning from failure.",
    "Apple":      "a senior Apple engineer. Focus on quality, attention to detail, user experience, and end-to-end ownership.",
    "Netflix":    "a senior Netflix interviewer. Focus on judgment, candor, high performance, and freedom with responsibility.",
    "Uber":       "a senior Uber engineer. Focus on system reliability, real-time systems, and making decisions under uncertainty.",
    "OpenAI":     "a senior OpenAI researcher/engineer. Probe deep ML/AI fundamentals, research mindset, and first-principles thinking.",
    "Anthropic":  "a senior Anthropic researcher. Ask deeply about AI safety, alignment, and technical ML depth.",
    "Stripe":     "a senior Stripe engineer. Focus on API design, reliability, distributed systems, and developer experience.",
    "Airbnb":     "a senior Airbnb engineer. Balance technical skill with product empathy and design thinking.",
    "Atlassian":  "a senior Atlassian engineer. Focus on team collaboration tools, scalability, and developer productivity.",
    "Adobe":      "a senior Adobe engineer. Focus on multimedia processing, creative tools, and performance.",
    "Salesforce": "a senior Salesforce engineer. Focus on enterprise software, multi-tenancy, and CRM architecture.",
    "NVIDIA":     "a senior NVIDIA engineer. Focus on GPU programming, parallel computing, CUDA, and hardware-software optimization.",
    "Default":    "a senior tech industry interviewer at a top technology company.",
}

ROUND_DESCRIPTIONS = {
    "resume_screening":  "Resume Screening — analyze the candidate's background, education, projects, and experience from their resume or LinkedIn profile.",
    "recruiter":         "Recruiter Screen — assess cultural fit, motivation, salary expectations, and high-level background.",
    "behavioral":        "Behavioral Round — ask STAR-format questions on leadership, ownership, teamwork, conflict resolution, growth mindset, communication.",
    "technical_screen":  "Technical Phone Screen — assess core CS fundamentals, language-specific knowledge, and basic problem-solving.",
    "coding":            "Coding Round — give a real LeetCode-style DSA problem. Walk through brute force → optimal solution. Check time/space complexity, edge cases.",
    "debugging":         "Debugging Round — present realistic buggy code (memory leaks, concurrency issues, API failures, logic errors). Evaluate debugging methodology.",
    "project_deepdive":  "Project Deep Dive — challenge every claim on the resume. Ask about architecture, database choice, deployment, scaling, security, monitoring, failures.",
    "system_design":     "System Design Round — design a large-scale distributed system (WhatsApp, YouTube, Uber, etc.). Evaluate requirements, data modeling, caching, load balancing, tradeoffs.",
    "ai_ml":             "AI/ML Technical Round — probe Python, statistics, ML algorithms, deep learning, transformers, LLMs, RAG, MLOps, inference optimization.",
    "leadership":        "Leadership Round — assess ability to lead teams, handle ambiguity, drive projects end-to-end, mentor others.",
    "hr":                "HR / Final Round — salary negotiation, career goals, team fit, offer logistics.",
    "final_eval":        "Final Evaluation — synthesize all rounds, provide holistic hire/no-hire recommendation with detailed feedback.",
}


def _build_interviewer_prompt(session: dict) -> str:
    company   = session.get("company", "Default")
    role      = session.get("role", "Software Engineer")
    level     = session.get("level", "Mid-level")
    stack     = session.get("stack", "")
    round_key = session.get("current_round", "behavioral")
    lang      = session.get("language", "en")

    persona      = COMPANY_PERSONAS.get(company, COMPANY_PERSONAS["Default"])
    round_desc   = ROUND_DESCRIPTIONS.get(round_key, "General technical interview round.")
    lang_note    = f"Conduct the interview in {'English' if lang == 'en' else lang}." if lang != "en" else ""

    resume_section = ""
    if session.get("resume_text"):
        resume_section = f"\n\nCANDIDATE RESUME (first 3000 chars):\n{session['resume_text'][:3000]}"

    return f"""You are {persona}

You are conducting a real interview for a {level} {role} position at {company}.

CURRENT ROUND: {round_desc}

TECH STACK MENTIONED: {stack or 'Not specified'}

INTERVIEW RULES:
- Ask ONE focused question at a time. Never dump multiple questions.
- After the candidate answers, give brief evaluation (1-2 sentences), then ask a follow-up or move on.
- Be realistic, professional, and appropriately challenging — not easy, not cruel.
- Use specific technical vocabulary appropriate to the role and level.
- For coding rounds: give actual algorithm problems with examples.
- For system design: give a specific system to design with constraints.
- For behavioral: probe deeply with follow-up questions. Challenge vague answers.
- Never break character. You ARE the interviewer.
- Do NOT say "Great answer!" or give hollow praise. Give honest, concise assessments.
- Format: Your response is conversational interviewer speech. No markdown headers. Keep it natural.
{lang_note}
{resume_section}"""


def generate_first_question(session: dict) -> str:
    """Generate the opening question for a new interview session."""
    company   = session.get("company", "Default")
    role      = session.get("role", "Software Engineer")
    level     = session.get("level", "Mid-level")
    round_key = session.get("current_round", "recruiter")

    system = _build_interviewer_prompt(session)
    user   = f"Start the interview. Introduce yourself briefly (one sentence, no filler), then ask your first question for the {ROUND_DESCRIPTIONS.get(round_key, round_key)} round. Be direct."
    return call_ai(system, user, max_tokens=512, temperature=0.8)


def evaluate_and_continue(session: dict, candidate_answer: str) -> dict:
    """
    Evaluate candidate's answer and return:
    {
      "feedback": "...",         # Internal evaluation (1-2 sentences)
      "score": 7,                # 1-10
      "next_message": "...",     # Interviewer's next message to candidate
      "should_advance": false,   # Whether to move to next round
      "round_complete": false    # Whether this round is done
    }
    """
    history_text = ""
    for msg in session.get("messages", [])[-8:]:
        role    = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        history_text += f"{role}: {msg['content']}\n\n"

    system = _build_interviewer_prompt(session)
    user = f"""CONVERSATION SO FAR:
{history_text}

The candidate just said:
\"\"\"{candidate_answer}\"\"\"

Respond as the interviewer. Do the following in your response:
1. Give a brief honest reaction to their answer (1-2 sentences max) — assess it clearly, challenge if needed
2. Either ask a relevant follow-up OR, if this topic is exhausted, transition to the next question/topic
3. Keep it to 3-5 sentences total. Natural, conversational interviewer speech.

Then on a NEW line, output EXACTLY this JSON (no other text after it):
<<<EVAL>>>
{{"score": <1-10>, "feedback": "<one sentence honest assessment>", "round_complete": <true if you covered 2+ questions in this round>, "advance_round": false}}"""

    raw = call_ai(system, user, max_tokens=800, temperature=0.7)

    # Split on <<<EVAL>>>
    parts        = raw.split("<<<EVAL>>>")
    next_message = parts[0].strip()
    eval_data    = {}

    if len(parts) > 1:
        try:
            import json, re
            json_str = parts[1].strip()
            match    = re.search(r'\{[\s\S]*\}', json_str)
            if match:
                eval_data = json.loads(match.group(0))
        except Exception:
            pass

    return {
        "next_message":    next_message,
        "score":           eval_data.get("score", 5),
        "feedback":        eval_data.get("feedback", ""),
        "round_complete":  eval_data.get("round_complete", False),
        "advance_round":   eval_data.get("advance_round", False),
    }


def generate_session_report(session: dict) -> dict:
    """Generate a comprehensive end-of-interview report."""
    company = session.get("company", "Default")
    role    = session.get("role", "Software Engineer")
    level   = session.get("level", "Mid-level")
    rounds  = session.get("completed_rounds", [])
    scores  = session.get("round_scores", {})

    history_text = ""
    for msg in session.get("messages", []):
        role_label   = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        history_text += f"{role_label}: {msg['content']}\n\n"

    system = f"""You are a senior {company} hiring manager writing an internal candidate evaluation report.
Be honest, specific, and professional. This is an internal document — be candid."""

    user = f"""Based on this interview transcript, write a detailed hiring report for {level} {role} at {company}.

TRANSCRIPT:
{history_text[:6000]}

Respond with ONLY valid JSON:
{{
  "overall_verdict": "Strong Hire | Hire | No Hire | Strong No Hire",
  "overall_score": <1-100>,
  "hire_recommendation": "<2-3 sentence summary>",
  "round_scores": {{
    "technical": <1-10>,
    "communication": <1-10>,
    "problem_solving": <1-10>,
    "cultural_fit": <1-10>,
    "leadership": <1-10>
  }},
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "areas_to_improve": [
    {{"topic": "<topic>", "recommendation": "<specific action to take>"}},
    {{"topic": "<topic>", "recommendation": "<specific action to take>"}}
  ],
  "next_steps": "<what candidate should do to improve>",
  "interview_feedback": "<detailed 3-4 sentence holistic assessment>"
}}"""

    return call_ai_json(system, user, max_tokens=2000)


def get_supported_companies() -> list:
    return list(COMPANY_PERSONAS.keys())


def get_interview_rounds(role: str) -> list:
    """Return appropriate rounds for a given role."""
    base_rounds = ["recruiter", "behavioral", "technical_screen", "coding", "project_deepdive", "hr"]

    if any(kw in role.lower() for kw in ["ml", "ai", "machine learning", "data scientist"]):
        base_rounds = ["recruiter", "behavioral", "technical_screen", "ai_ml", "coding", "project_deepdive", "hr"]
    elif any(kw in role.lower() for kw in ["senior", "staff", "principal", "manager"]):
        base_rounds = ["recruiter", "behavioral", "technical_screen", "coding", "system_design", "project_deepdive", "leadership", "hr"]
    elif any(kw in role.lower() for kw in ["backend", "full stack", "fullstack", "cloud", "devops"]):
        base_rounds = ["recruiter", "behavioral", "technical_screen", "coding", "system_design", "debugging", "hr"]

    return base_rounds
