"""Midjourney — pas d'API officielle publique.

Ce script formate le prompt prêt à coller (web ou Discord) avec les bons paramètres.

Usage :
  python api/midjourney.py format --prompt "..." [--aspect 1:1] [--style raw] [--version 7]
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import run_cli  # noqa: E402


def format(prompt: str, aspect: str = "1:1", style: str | None = "raw", version: str = "7", no: str | None = None) -> dict:
    """Renvoie la ligne /imagine prête à copier."""
    parts = [prompt.strip().rstrip("."), f"--ar {aspect}", f"--v {version}"]
    if style:
        parts.append(f"--style {style}")
    if no:
        parts.append(f"--no {no}")
    line = " ".join(parts)
    return {"stub": True, "platform": "midjourney", "copier_coller": f"/imagine prompt: {line}"}


COMMANDS = {
    "format": (format, [
        ("--prompt", {"required": True}),
        ("--aspect", {"default": "1:1"}),
        ("--style", {"default": "raw"}),
        ("--version", {"default": "7"}),
        ("--no", {"default": None, "help": "éléments à exclure, séparés par des virgules"}),
    ]),
}

if __name__ == "__main__":
    run_cli(__doc__, COMMANDS)
