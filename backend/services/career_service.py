"""
career_service.py
-----------------
Career roadmap generation and job readiness scoring.
"""
from .ai_orchestrator import call_ai, call_ai_json


def generate_roadmap(
    target_role: str,
    target_company: str,
    current_level: str,
    current_skills: list,
    timeline_weeks: int = 12,
) -> dict:
    """Generate a personalized career roadmap."""
    skills_str = ", ".join(current_skills) if current_skills else "not specified"

    system = """You are a senior engineering career coach who has helped hundreds of engineers land offers at FAANG.
You create precise, actionable, week-by-week study plans. No fluff. Every recommendation is specific."""

    user = f"""Create a {timeline_weeks}-week roadmap for this engineer:
Target Role: {target_role}
Target Company: {target_company}
Current Level: {current_level}
Current Skills: {skills_str}

Respond with ONLY valid JSON:
{{
  "target_role": "{target_role}",
  "target_company": "{target_company}",
  "timeline_weeks": {timeline_weeks},
  "skill_gaps": ["<gap 1>", "<gap 2>", "<gap 3>", "<gap 4>"],
  "weekly_plan": [
    {{
      "week": 1,
      "theme": "<week theme>",
      "focus_areas": ["<area>", "<area>"],
      "daily_tasks": [
        {{"day": "Mon", "task": "<specific task>", "resource": "<book/course/platform>", "duration_hrs": 2}},
        {{"day": "Tue", "task": "<specific task>", "resource": "<resource>", "duration_hrs": 2}},
        {{"day": "Wed", "task": "<specific task>", "resource": "<resource>", "duration_hrs": 2}},
        {{"day": "Thu", "task": "<specific task>", "resource": "<resource>", "duration_hrs": 2}},
        {{"day": "Fri", "task": "<specific task>", "resource": "<resource>", "duration_hrs": 2}},
        {{"day": "Sat", "task": "<mock interview or project>", "resource": "<resource>", "duration_hrs": 4}},
        {{"day": "Sun", "task": "Review + revision", "resource": "Notes", "duration_hrs": 2}}
      ],
      "milestone": "<what you should be able to do by end of week>"
    }}
  ],
  "monthly_milestones": [
    {{"month": 1, "goal": "<goal>", "checkpoint": "<how to verify>"}},
    {{"month": 2, "goal": "<goal>", "checkpoint": "<how to verify>"}},
    {{"month": 3, "goal": "<goal>", "checkpoint": "<how to verify>"}}
  ],
  "resources": [
    {{"name": "<resource name>", "type": "book|course|platform|practice", "url": "<url or N/A>", "priority": "must|recommended|optional"}},
    {{"name": "<resource name>", "type": "book|course|platform|practice", "url": "<url or N/A>", "priority": "must"}}
  ],
  "daily_habit": "<single most important daily habit for success>",
  "interview_prep_start_week": <week number when to start mock interviews>
}}

Generate realistic weekly plans for all {timeline_weeks} weeks (can be summarized after week 4)."""

    return call_ai_json(system, user, max_tokens=4096)


def calculate_readiness(profile: dict) -> dict:
    """
    Calculate job readiness scores across multiple tracks.
    profile: {
      problems_solved, streak_days, interview_scores, resume_score,
      skills, experience_years, projects_count, target_role
    }
    """
    problems  = profile.get("problems_solved", 0)
    streak    = profile.get("streak_days", 0)
    scores    = profile.get("interview_scores", [])
    resume    = profile.get("resume_score", 0)
    skills    = profile.get("skills", [])
    exp_years = profile.get("experience_years", 0)
    projects  = profile.get("projects_count", 0)
    role      = profile.get("target_role", "Software Engineer")

    avg_interview = sum(scores) / len(scores) if scores else 0

    system = "You are a career assessment expert at a top tech company."
    user = f"""Assess this candidate's readiness for various job tracks:

Profile:
- Problems solved on LeetCode/similar: {problems}
- Current streak: {streak} days
- Average interview score: {avg_interview:.1f}/10
- Resume score: {resume}/100
- Skills: {', '.join(skills[:15]) if skills else 'Not specified'}
- Years of experience: {exp_years}
- Projects count: {projects}
- Target role: {role}

Respond with ONLY valid JSON:
{{
  "overall_readiness": <0-100>,
  "tracks": {{
    "internship":    {{"score": <0-100>, "verdict": "Ready|Almost|Not Yet", "gap": "<main gap>"}},
    "sde1":          {{"score": <0-100>, "verdict": "Ready|Almost|Not Yet", "gap": "<main gap>"}},
    "sde2":          {{"score": <0-100>, "verdict": "Ready|Almost|Not Yet", "gap": "<main gap>"}},
    "faang":         {{"score": <0-100>, "verdict": "Ready|Almost|Not Yet", "gap": "<main gap>"}},
    "startup":       {{"score": <0-100>, "verdict": "Ready|Almost|Not Yet", "gap": "<main gap>"}},
    "dsa":           {{"score": <0-100>, "verdict": "Strong|Good|Needs Work|Weak"}},
    "system_design": {{"score": <0-100>, "verdict": "Strong|Good|Needs Work|Weak"}},
    "frontend":      {{"score": <0-100>, "verdict": "Strong|Good|Needs Work|Weak"}},
    "backend":       {{"score": <0-100>, "verdict": "Strong|Good|Needs Work|Weak"}},
    "ai_ml":         {{"score": <0-100>, "verdict": "Strong|Good|Needs Work|Weak"}}
  }},
  "top_recommendations": [
    {{"priority": 1, "action": "<most important thing to do right now>"}},
    {{"priority": 2, "action": "<second most important action>"}},
    {{"priority": 3, "action": "<third action>"}}
  ],
  "estimated_ready_date": "<X weeks from now to be internship/sde1 ready>"
}}"""

    return call_ai_json(system, user, max_tokens=1500)


def get_dashboard_insights(user_stats: dict) -> dict:
    """Generate AI insights for the dashboard."""
    system = "You are a concise career coach. Give sharp, motivating insights in 1-2 sentences each."
    user   = f"""User stats: {user_stats}

Give 3 insights as JSON:
{{
  "daily_tip": "<actionable tip for today>",
  "strength": "<what they are doing well>",
  "focus_area": "<what to prioritize this week>"
}}"""
    return call_ai_json(system, user, max_tokens=400)
