"""
ai_orchestrator.py
------------------
Central AI caller for all Friday Career OS services.
Uses the same Groq client as main.py — no duplicate client setup.
"""
import os
import re
import json
import logging
from groq import Groq, RateLimitError, APIError

logger = logging.getLogger(__name__)

# Shared Groq client — lazily initialised on first use
_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY environment variable is not set")
        _client = Groq(api_key=api_key)
    return _client


MODEL = "llama-3.3-70b-versatile"


def call_ai(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> str:
    """
    Call Groq and return the raw text response.
    Raises on hard failures; returns empty string on empty response.
    """
    try:
        client = _get_client()          # ← always resolve the client here
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return (resp.choices[0].message.content or "").strip()
    except RateLimitError:
        logger.warning("Groq rate limit hit in ai_orchestrator")
        raise
    except APIError as e:
        logger.error("Groq API error: %s", e)
        raise


def call_ai_json(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
) -> dict:
    """
    Call Groq expecting a JSON response.
    Strips markdown fences, parses JSON.
    Returns {} on parse failure.
    """
    raw = call_ai(system_prompt, user_prompt, max_tokens=max_tokens, temperature=0.2)

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"```$",          "", raw).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON object from anywhere in the response
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        logger.warning(
            "ai_orchestrator: failed to parse JSON from response: %s", raw[:200]
        )
        return {}