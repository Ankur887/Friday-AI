"""
career.py — FastAPI router for Career Roadmap + Job Readiness
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.career_service import (
    generate_roadmap,
    calculate_readiness,
    get_dashboard_insights,
)

router = APIRouter(prefix="/career", tags=["career"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RoadmapRequest(BaseModel):
    target_role:     str
    target_company:  str           = ""
    current_level:   str           = "Beginner"
    current_skills:  List[str]     = []
    timeline_weeks:  int           = 12

class ReadinessRequest(BaseModel):
    problems_solved:   int         = 0
    streak_days:       int         = 0
    interview_scores:  List[float] = []
    resume_score:      float       = 0.0
    skills:            List[str]   = []
    experience_years:  float       = 0.0
    projects_count:    int         = 0
    target_role:       str         = "Software Engineer"

class DashboardInsightsRequest(BaseModel):
    user_stats: dict


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/roadmap")
async def get_roadmap(req: RoadmapRequest):
    """Generate a personalised week-by-week career roadmap."""
    if not req.target_role.strip():
        raise HTTPException(status_code=400, detail="target_role is required")
    try:
        result = generate_roadmap(
            target_role=req.target_role,
            target_company=req.target_company,
            current_level=req.current_level,
            current_skills=req.current_skills,
            timeline_weeks=max(4, min(req.timeline_weeks, 24)),
        )
        if not result:
            raise HTTPException(status_code=500, detail="Roadmap generation failed")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/readiness")
async def get_readiness(req: ReadinessRequest):
    """Calculate job readiness scores across all tracks."""
    try:
        result = calculate_readiness(req.dict())
        if not result:
            raise HTTPException(status_code=500, detail="Readiness calculation failed")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def get_insights(req: DashboardInsightsRequest):
    """Get AI-generated daily tips and insights for the dashboard."""
    try:
        return get_dashboard_insights(req.user_stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tracks")
async def list_tracks():
    """Return all available readiness tracks."""
    return {
        "tracks": [
            {"id": "internship",    "label": "Internship",    "icon": "🎓"},
            {"id": "sde1",          "label": "SDE-1",         "icon": "👨‍💻"},
            {"id": "sde2",          "label": "SDE-2",         "icon": "🚀"},
            {"id": "faang",         "label": "FAANG",         "icon": "⭐"},
            {"id": "startup",       "label": "Startup",       "icon": "⚡"},
            {"id": "dsa",           "label": "DSA",           "icon": "🧮"},
            {"id": "system_design", "label": "System Design", "icon": "🏗️"},
            {"id": "frontend",      "label": "Frontend",      "icon": "🎨"},
            {"id": "backend",       "label": "Backend",       "icon": "⚙️"},
            {"id": "ai_ml",         "label": "AI / ML",       "icon": "🤖"},
        ]
    }
