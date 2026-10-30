"""Stub API Canva — création de designs à partir d'un modèle.

Usage :
  python api/canva.py create --title "..." [--template ID] [--format 1080x1080]
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import is_stub, not_wired, run_cli, stub  # noqa: E402

PLATFORM = "canva"
KEYS = ["CANVA_ACCESS_TOKEN"]
DOC = "https://www.canva.dev/docs/connect/"


def create(title: str, template: str | None = None, format: str = "1080x1080") -> dict:
    """Crée un design Canva (autofill d'un modèle de marque)."""
    payload = {"title": title, "template": template, "format": format}
    if is_stub(*KEYS):
        return stub(PLATFORM, "create", payload, KEYS)
    return not_wired(PLATFORM, "create", DOC)


COMMANDS = {
    "create": (create, [
        ("--title", {"required": True}),
        ("--template", {"default": None}),
        ("--format", {"default": "1080x1080"}),
    ]),
}

if __name__ == "__main__":
    run_cli(__doc__, COMMANDS)
