"""
resume_service.py
-----------------
Resume analysis and AI-assisted content generation.
FIXED:
  - All prompts now use .get() with sensible fallbacks so a mostly-empty
    user_info dict (coming from a single textarea string) still produces
    great output.
  - "description" key is the primary carrier of user text when the frontend
    sends a raw string.
"""
import re
from .ai_orchestrator import call_ai, call_ai_json


def analyze_resume(
    resume_text: str,
    target_role: str = "",
    target_company: str = "",
) -> dict:
    """
    Analyze a resume against a target role and return a comprehensive report.
    """
    target_ctx = ""
    if target_role or target_company:
        target_ctx = (
            f"The candidate is targeting: "
            f"{target_role or 'Not specified'} at {target_company or 'Not specified'}."
        )

    system = (
        "You are a senior technical recruiter and ATS expert with 15+ years of "
        "experience at FAANG companies. You analyze resumes with surgical precision. "
        "Be direct, honest, and specific."
    )

    user = f"""{target_ctx}

RESUME TEXT:
{resume_text[:8000]}

Analyze this resume thoroughly and respond with ONLY valid JSON:
{{
  "overall_score": <0-100>,
  "ats_score": <0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "verdict": "Strong | Good | Needs Work | Weak",
  "sections": {{
    "education":  {{"score": <0-10>, "feedback": "<specific feedback>", "issues": ["<issue>"]}},
    "experience": {{"score": <0-10>, "feedback": "<specific feedback>", "issues": ["<issue>"]}},
    "projects":   {{"score": <0-10>, "feedback": "<specific feedback>", "issues": ["<issue>"]}},
    "skills":     {{"score": <0-10>, "feedback": "<specific feedback>", "issues": ["<issue>"]}},
    "formatting": {{"score": <0-10>, "feedback": "<specific feedback>", "issues": ["<issue>"]}}
  }},
  "strengths":          ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses":         ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "missing_keywords":   ["<keyword>", "<keyword>", "<keyword>"],
  "ats_issues":         ["<ats issue>", "<ats issue>"],
  "improvements": [
    {{"priority": "high",   "section": "<section>", "action": "<specific action>"}},
    {{"priority": "high",   "section": "<section>", "action": "<specific action>"}},
    {{"priority": "medium", "section": "<section>", "action": "<specific action>"}}
  ],
  "recruiter_concerns": ["<concern>", "<concern>"],
  "standout_factors":   ["<factor>",  "<factor>"]
}}"""

    return call_ai_json(system, user, max_tokens=2500)


def generate_resume_section(section_type: str, user_info: dict) -> str:
    """
    Generate AI-written content for a specific resume section.

    section_type: summary | experience_bullet | project_description | skills

    user_info keys (all optional with fallbacks):
      description    — raw text the user typed (primary source)
      target_role    — e.g. "Software Engineer"
      target_company — e.g. "Google"
      raw_skills     — alias for description when section_type == skills
      notable        — alias for description when section_type == summary
      company        — company name for experience bullets
      role           — job title for experience bullets
      tech           — tech stack
      project_name   — project name
      impact         — project impact/results
      experience_years — years of experience
    """
    system = (
        "You are an expert resume writer. You write achievement-focused, quantified, "
        "ATS-optimized resume content. Use strong action verbs. No filler. No clichés. "
        "No 'responsible for'. Focus on impact and metrics."
    )

    # ── Pull values with safe fallbacks ──────────────────────────────────────
    description    = user_info.get("description", "")
    target_role    = user_info.get("target_role", "Software Engineer") or "Software Engineer"
    target_company = user_info.get("target_company", "") or ""
    raw_skills     = user_info.get("raw_skills", "") or description
    notable        = user_info.get("notable", "")    or description
    company        = user_info.get("company", target_company) or target_company or "the company"
    role           = user_info.get("role", target_role) or target_role
    tech           = user_info.get("tech", "") or ""
    project_name   = user_info.get("project_name", "Project") or "Project"
    impact         = user_info.get("impact", "") or ""
    exp_years      = user_info.get("experience_years", "2") or "2"

    # ── Build company context line for experience ─────────────────────────────
    company_line = f"Company: {company}" if company else ""
    role_line    = f"Role: {role}"       if role    else ""

    prompts = {
        "summary": f"""Write a 2-3 sentence professional summary for this person.

Target role: {target_role}
{f"Target company: {target_company}" if target_company else ""}
Years of experience: {exp_years}
What they do / skills / achievements:
{notable or description}

Rules:
- Start with a strong identity statement (e.g. "Full-stack engineer with…")
- Include 2-3 specific skills or achievements
- End with what they bring to the team
- NO clichés ("passionate", "team player", "hardworking")
- Write ONLY the summary text. No labels. No quotes.""",

        "experience_bullet": f"""Write 3-4 strong bullet points for this work experience.

{company_line}
{role_line}
What they did / context:
{description}
{f"Tech used: {tech}" if tech else ""}

Rules:
- Start EVERY bullet with a strong past-tense verb (Built, Led, Reduced, Designed…)
- Include at least one quantified metric (%, x faster, N users, $amount)
- Be specific — avoid vague language
- Each bullet = one clear achievement
- Write ONLY the bullet points (starting with •). No headers.""",

        "project_description": f"""Write 2-3 bullet points for this project.

Project: {project_name}
What it does / context:
{description}
{f"Tech stack: {tech}"   if tech   else ""}
{f"Impact / results: {impact}" if impact else ""}

Rules:
- First bullet: what the project does and why it matters
- Second bullet: technical implementation highlights
- Third bullet (if warranted): measurable impact or outcome
- Start each with a strong verb
- Write ONLY the bullet points (starting with •). No project name header.""",

        "skills": f"""Organize these skills into a clean, ATS-friendly skills section.

Raw skills:
{raw_skills or description}
Target role: {target_role}

Output format — use EXACTLY this structure:
Languages: Python, JavaScript, TypeScript, …
Frameworks: React, Node.js, FastAPI, …
Databases: PostgreSQL, MongoDB, Redis, …
Tools & DevOps: Docker, Kubernetes, Git, AWS, …
(Add or remove categories as appropriate — only include non-empty ones)

Write ONLY the formatted skills. No headers or intro text.""",
    }

    prompt = prompts.get(
        section_type,
        f"Generate {section_type} section content based on: {description}",
    )
    return call_ai(system, prompt, max_tokens=700, temperature=0.7)


def check_ats_compatibility(resume_text: str) -> dict:
    """Quick ATS compatibility check."""
    system = (
        "You are an ATS (Applicant Tracking System) expert. "
        "Analyze resumes for ATS compatibility."
    )
    user = f"""Check this resume for ATS compatibility:
{resume_text[:5000]}

Respond with ONLY valid JSON:
{{
  "ats_score": <0-100>,
  "issues":           ["<issue>"],
  "passes":           ["<what it does well>"],
  "keyword_density":  "<low|medium|high>"
}}"""
    return call_ai_json(system, user, max_tokens=800)