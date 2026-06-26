"""
memory.py — Long-term memory for Friday AI (SQLite edition)
============================================================
Drop-in replacement for the PostgresStore/pgvector version.
Uses only Python's built-in sqlite3 — no extra installs needed.

Search strategy: recency-weighted keyword overlap.
  - Each query word is matched against stored memory text (case-insensitive).
  - Score = keyword_matches * 2 + recency_bonus (newer = higher bonus).
  - Falls back to pure recency if no keywords match.

Facts are stored separately and retrieved by key lookup.
"""

from __future__ import annotations

import os
import re
import json
import sqlite3
import hashlib
import logging
import threading
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# Path to the SQLite database file.
# Override via MEMORY_DB_PATH env var if you want it somewhere specific.
_DEFAULT_DB = os.path.join(os.path.dirname(__file__), "friday_memory.db")
DB_PATH        = os.getenv("MEMORY_DB_PATH", _DEFAULT_DB)

TOP_K_MEMORIES = 6
TOP_K_FACTS    = 4

# ── Thread-local connections (safe for FastAPI's thread pool) ─────────────────
_local = threading.local()


def _conn() -> sqlite3.Connection:
    """Return a per-thread SQLite connection, creating it if needed."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")   # safe for concurrent reads
        _local.conn.execute("PRAGMA synchronous=NORMAL")
    return _local.conn


def _setup() -> None:
    """Create tables if they don't exist yet."""
    db = _conn()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS memories (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            conversation_id TEXT NOT NULL,
            role            TEXT NOT NULL,
            text            TEXT NOT NULL,
            created_at      TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);

        CREATE TABLE IF NOT EXISTS user_facts (
            user_id    TEXT NOT NULL,
            fact_key   TEXT NOT NULL,
            fact_value TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, fact_key)
        );
        CREATE INDEX IF NOT EXISTS idx_facts_user ON user_facts(user_id);
    """)
    db.commit()
    logger.info("SQLite memory store ready at %s", DB_PATH)


# Run setup once at import time
_setup()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _memory_id(user_id: str, text: str) -> str:
    return hashlib.sha256(f"{user_id}:{text}".encode()).hexdigest()[:24]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _tokenize(text: str) -> set:
    """Lower-case word tokens, stripping punctuation."""
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _score(memory_text: str, query_tokens: set, total: int, rank: int) -> float:
    """
    Score a memory against a query.
    keyword_score : number of query words found in the memory text
    recency_score : linear decay — most recent = total, oldest = 1
    """
    mem_tokens    = _tokenize(memory_text)
    keyword_score = len(query_tokens & mem_tokens) * 2.0
    recency_score = (total - rank) / max(total, 1)
    return keyword_score + recency_score


# ── Public API ────────────────────────────────────────────────────────────────

def store_memory(
    user_id: str,
    conversation_id: str,
    user_message: str,
    ai_reply: str,
) -> None:
    """Persist a (user message, AI reply) pair. Call after getting the AI reply."""
    db  = _conn()
    now = _now_iso()

    rows = []
    for role, text in [("user", user_message), ("assistant", ai_reply)]:
        text = text.strip()
        if text:
            rows.append((
                _memory_id(user_id, text),
                user_id,
                conversation_id,
                role,
                text,
                now,
            ))

    if rows:
        db.executemany(
            """INSERT OR REPLACE INTO memories
               (id, user_id, conversation_id, role, text, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            rows,
        )
        db.commit()


def search_relevant_memories(
    user_id: str,
    query: str,
    top_k: int = TOP_K_MEMORIES,
) -> list:
    """
    Return the top-k most relevant past memories for this user.
    Ranked by keyword overlap with the query + recency.
    """
    db = _conn()
    rows = db.execute(
        "SELECT role, text, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
        (user_id,),
    ).fetchall()

    if not rows:
        return []

    query_tokens = _tokenize(query)
    total        = len(rows)

    scored = [
        (
            _score(r["text"], query_tokens, total, i),
            {"role": r["role"], "text": r["text"], "created_at": r["created_at"]},
        )
        for i, r in enumerate(rows)
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [m for _, m in scored[:top_k]]


def store_user_fact(user_id: str, fact_key: str, fact_value: str) -> None:
    """Store a durable fact about the user (overwrites previous value for same key)."""
    db = _conn()
    db.execute(
        """INSERT OR REPLACE INTO user_facts (user_id, fact_key, fact_value, updated_at)
           VALUES (?, ?, ?, ?)""",
        (user_id, fact_key, fact_value, _now_iso()),
    )
    db.commit()


def get_user_facts(user_id: str, top_k: int = TOP_K_FACTS) -> list:
    """Return up to top_k durable facts about this user."""
    db   = _conn()
    rows = db.execute(
        "SELECT fact_key, fact_value FROM user_facts WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?",
        (user_id, top_k),
    ).fetchall()
    return [f"{r['fact_key']}: {r['fact_value']}" for r in rows]


def extract_and_store_facts(user_id: str, user_message: str, groq_client) -> None:
    """
    Ask the LLM to extract durable facts from the user's message and persist them.
    Call this in a background task so it doesn't slow down the main reply.
    """
    extraction_prompt = f"""Extract durable personal facts from this message.
Return a JSON object where keys are fact names (snake_case) and values are the fact.
Only include facts that are clearly stated. Return {{}} if nothing durable is said.
Do NOT include temporary questions or tasks.

Examples of durable facts: name, job, city, language, hobby, goal, project_name, preferred_language.

Message: "{user_message}"

Return ONLY the JSON object, no explanation."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": extraction_prompt}],
            max_tokens=256,
            temperature=0.0,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        facts: dict = json.loads(raw.strip())
        for key, value in facts.items():
            if isinstance(value, str) and value.strip():
                store_user_fact(user_id, key.strip(), value.strip())
                logger.debug("Stored fact for %s: %s = %s", user_id, key, value)
    except Exception as exc:
        logger.debug("Fact extraction skipped: %s", exc)


def build_memory_context(user_id: str, query: str) -> str:
    """
    Build the memory block injected into the system prompt.
    Returns an empty string if no memories exist yet.
    """
    facts    = get_user_facts(user_id)
    memories = search_relevant_memories(user_id, query)

    lines = []

    if facts:
        lines.append("## What I know about you")
        for f in facts:
            lines.append(f"- {f}")
        lines.append("")

    if memories:
        lines.append("## Relevant past context")
        for m in memories:
            role = "You" if m["role"] == "user" else "Friday"
            lines.append(f"- [{role}] {m['text']}")
        lines.append("")

    if not lines:
        return ""

    return (
        "---\n"
        "**Memory** (use this to personalize your reply — do not recite it verbatim):\n\n"
        + "\n".join(lines)
        + "---\n"
    )


# ── Stubs for import compatibility with main.py ───────────────────────────────
# main.py imports get_embedder, embed, get_store — these are no-ops now.

def get_embedder():
    return None

def embed(text: str) -> list:
    return []

def get_store():
    return None