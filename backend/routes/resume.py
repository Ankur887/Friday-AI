"""
resume.py — FastAPI router for Resume Builder + Analyzer
FIXED:
  - ResumeSectionRequest now accepts user_info as str (what the frontend sends)
    AND target_role / target_company as top-level fields
  - section_type keys mapped: "experience" → "experience_bullet",
                               "projects"   → "project_description"
  - valid_types expanded to include the short frontend keys
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Union
from services.resume_service import (
    analyze_resume,
    generate_resume_section,
    check_ats_compatibility,
)

router = APIRouter(prefix="/resume", tags=["resume"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ResumeAnalyzeRequest(BaseModel):
    resume_text:    str
    target_role:    str = ""
    target_company: str = ""


class ResumeSectionRequest(BaseModel):
    section_type:   str
    # Frontend sends a plain string; dict is also accepted for backwards compat
    user_info:      Union[str, dict]
    target_role:    str = ""
    target_company: str = ""


class ATSCheckRequest(BaseModel):
    resume_text: str


# ── Key normalisation map ────────────────────────────────────────────────────
# Frontend key  →  service key expected by resume_service.py
SECTION_KEY_MAP = {
    "summary":             "summary",
    "experience":          "experience_bullet",
    "experience_bullet":   "experience_bullet",
    "projects":            "project_description",
    "project_description": "project_description",
    "skills":              "skills",
}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze(req: ResumeAnalyzeRequest):
    """Full resume analysis — ATS score, section scores, improvements."""
    try:
        result = analyze_resume(req.resume_text, req.target_role, req.target_company)
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Analysis failed — empty response from AI",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-section")
async def generate_section(req: ResumeSectionRequest):
    """
    Generate AI-written content for a resume section.

    Accepts section_type as either the short frontend key ("experience", "projects")
    or the long service key ("experience_bullet", "project_description").
    user_info can be a plain string (from the builder textarea) or a dict.
    """
    # Normalise section key
    mapped_type = SECTION_KEY_MAP.get(req.section_type)
    if not mapped_type:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid section_type '{req.section_type}'. "
                f"Must be one of: {', '.join(SECTION_KEY_MAP.keys())}"
            ),
        )

    # Build the user_info dict that resume_service.py expects
    if isinstance(req.user_info, str):
        # Frontend sends raw textarea text as user_info string
        user_info_dict: dict = {
            "description":   req.user_info,
            "target_role":   req.target_role,
            "target_company": req.target_company,
            # Alias keys used by specific prompts in resume_service.py
            "raw_skills":    req.user_info if mapped_type == "skills"           else "",
            "notable":       req.user_info if mapped_type == "summary"          else "",
        }
    else:
        # Already a dict — merge top-level role/company in case they're missing
        user_info_dict = dict(req.user_info)
        user_info_dict.setdefault("target_role",    req.target_role)
        user_info_dict.setdefault("target_company", req.target_company)

    try:
        content = generate_resume_section(mapped_type, user_info_dict)
        return {"content": content, "section_type": mapped_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ats-check")
async def ats_check(req: ATSCheckRequest):
    """Quick ATS compatibility check."""
    try:
        return check_ats_compatibility(req.resume_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))