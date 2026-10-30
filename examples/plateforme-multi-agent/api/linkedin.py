"""Stub API Linkedin — publication et analytics.

Usage :
  python api/linkedin.py publish --text "..." [--media chemin] [--schedule AAAA-MM-JJTHH:MM]
  python api/linkedin.py analytics [--since AAAA-MM-JJ] [--until AAAA-MM-JJ]
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import PERIOD_ARGS, analytics_stub, is_stub, not_wired, run_cli, stub  # noqa: E402

PLATFORM = "linkedin"
KEYS = ["LINKEDIN_ACCESS_TOKEN"]
DOC = "https://learn.microsoft.com/linkedin/marketing/"


def publish(text: str, media: str | None = None, schedule: str | None = None) -> dict:
    """Publie (ou programme) un post."""
    payload = {"text": text, "media": media, "schedule": schedule}
    if is_stub(*KEYS):
        return stub(PLATFORM, "publish", payload, KEYS, apercu=text[:280])
    # TODO : brancher l'appel réel (OAuth requis). Ne jamais publier sans validation utilisateur.
    return not_wired(PLATFORM, "publish", DOC)


def analytics(since: str, until: str) -> dict:
    """Récupère les statistiques de la période et les sauve dans analytics/exports/."""
    if is_stub(*KEYS):
        return analytics_stub(PLATFORM, since, until, KEYS)
    # TODO : appel réel puis : return {"export": save_export(PLATFORM, data)}
    return not_wired(PLATFORM, "analytics", DOC)


COMMANDS = {
    "publish": (publish, [
        ("--text", {"required": True, "help": "texte du post"}),
        ("--media", {"default": None}),
        ("--schedule", {"default": None}),
    ]),
    "analytics": (analytics, PERIOD_ARGS),
}

if __name__ == "__main__":
    run_cli(__doc__, COMMANDS)
