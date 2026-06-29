"""
voice_service.py
----------------
Text-based voice quality analysis (no audio processing needed).
Analyses the transcript for communication quality signals.
"""
import re


def analyze_voice_metrics(transcript: str, duration_seconds: float = 60.0) -> dict:
    """
    Analyse a speech transcript for communication quality.
    Returns scores and actionable feedback.
    """
    if not transcript or not transcript.strip():
        return _empty_metrics()

    words      = transcript.split()
    word_count = len(words)

    # ── Speaking pace (words per minute) ──────────────────────────────────────
    duration_min = max(duration_seconds / 60.0, 0.1)
    wpm          = word_count / duration_min
    # Ideal range: 130–160 wpm
    if 130 <= wpm <= 160:
        pace_score = 10
    elif 110 <= wpm < 130 or 160 < wpm <= 180:
        pace_score = 8
    elif 90 <= wpm < 110 or 180 < wpm <= 200:
        pace_score = 6
    else:
        pace_score = 4

    # ── Filler words ──────────────────────────────────────────────────────────
    filler_words = [
        "um", "uh", "like", "you know", "basically", "literally",
        "actually", "sort of", "kind of", "i mean", "right",
        "so yeah", "yeah so",
    ]
    text_lower    = transcript.lower()
    filler_count  = sum(text_lower.count(f" {fw} ") for fw in filler_words)
    filler_ratio  = filler_count / max(word_count, 1)
    if filler_ratio < 0.02:
        filler_score = 10
    elif filler_ratio < 0.05:
        filler_score = 8
    elif filler_ratio < 0.10:
        filler_score = 6
    else:
        filler_score = 4

    # ── Sentence structure / complexity ───────────────────────────────────────
    sentences     = re.split(r'[.!?]+', transcript)
    sentences     = [s.strip() for s in sentences if len(s.strip()) > 5]
    avg_sent_len  = word_count / max(len(sentences), 1)
    if 12 <= avg_sent_len <= 22:
        clarity_score = 10
    elif 8 <= avg_sent_len < 12 or 22 < avg_sent_len <= 30:
        clarity_score = 7
    else:
        clarity_score = 5

    # ── Technical vocabulary density ─────────────────────────────────────────
    tech_terms = [
        "algorithm", "complexity", "database", "api", "function", "class",
        "object", "method", "framework", "architecture", "deploy", "scale",
        "optimize", "implement", "refactor", "cache", "async", "thread",
        "memory", "stack", "queue", "tree", "graph", "hash", "binary",
        "component", "module", "service", "endpoint", "query", "index",
    ]
    tech_count   = sum(1 for w in words if w.lower() in tech_terms)
    tech_ratio   = tech_count / max(word_count, 1)
    if tech_ratio > 0.08:
        vocab_score = 10
    elif tech_ratio > 0.04:
        vocab_score = 8
    elif tech_ratio > 0.02:
        vocab_score = 6
    else:
        vocab_score = 4

    # ── Confidence signals ────────────────────────────────────────────────────
    confident_phrases   = ["i implemented", "i designed", "i built", "i led", "i solved",
                           "my approach", "i chose", "the reason i", "specifically"]
    uncertain_phrases   = ["i think maybe", "i'm not sure", "i don't know",
                           "i guess", "possibly", "i might be wrong"]
    conf_count   = sum(1 for p in confident_phrases if p in text_lower)
    uncert_count = sum(1 for p in uncertain_phrases if p in text_lower)
    confidence_score = max(4, min(10, 7 + conf_count - uncert_count * 2))

    # ── Composite scores ──────────────────────────────────────────────────────
    communication_score = round((clarity_score + filler_score + vocab_score) / 3, 1)
    professionalism_score = round((confidence_score + filler_score) / 2, 1)

    # ── Build feedback ────────────────────────────────────────────────────────
    feedback = []
    if filler_ratio > 0.05:
        feedback.append(f"Reduce filler words — detected {filler_count} instances. Practice pausing instead.")
    if wpm > 180:
        feedback.append("Speaking too fast. Slow down to 140-160 wpm for clarity.")
    elif wpm < 100:
        feedback.append("Speaking too slowly. Aim for 130-160 wpm to maintain engagement.")
    if tech_ratio < 0.04:
        feedback.append("Use more precise technical vocabulary to demonstrate expertise.")
    if uncert_count > 2:
        feedback.append("Replace uncertain phrases ('I think maybe', 'I guess') with confident assertions.")
    if avg_sent_len > 25:
        feedback.append("Shorten sentences. Long run-ons reduce clarity.")

    return {
        "word_count":           word_count,
        "wpm":                  round(wpm),
        "filler_count":         filler_count,
        "scores": {
            "confidence":       confidence_score,
            "clarity":          clarity_score,
            "communication":    communication_score,
            "speaking_pace":    pace_score,
            "professionalism":  professionalism_score,
            "vocabulary":       vocab_score,
        },
        "feedback":             feedback,
        "overall":              round((confidence_score + clarity_score + communication_score +
                                       pace_score + professionalism_score) / 5, 1),
    }


def _empty_metrics() -> dict:
    return {
        "word_count": 0, "wpm": 0, "filler_count": 0,
        "scores": {k: 0 for k in ["confidence", "clarity", "communication", "speaking_pace", "professionalism", "vocabulary"]},
        "feedback": ["No transcript available for analysis."],
        "overall": 0,
    }
