"""Stub API Ideogram — images avec texte lisible (titres, miniatures).

Usage :
  python api/ideogram.py image --prompt "..." [--aspect 1x1]
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import is_stub, not_wired, run_cli, stub  # noqa: E402

PLATFORM = "ideogram"
KEYS = ["IDEOGRAM_API_KEY"]
DOC = "https://developer.ideogram.ai/"


def image(prompt: str, aspect: str = "1x1") -> dict:
    """Génère une image Ideogram."""
    payload = {"prompt": prompt, "aspect_ratio": aspect}
    if is_stub(*KEYS):
        return stub(PLATFORM, "image", payload, KEYS)
    return not_wired(PLATFORM, "image", DOC)


COMMANDS = {
    "image": (image, [
        ("--prompt", {"required": True}),
        ("--aspect", {"default": "1x1", "choices": ["1x1", "9x16", "16x9", "4x5"]}),
    ]),
}

if __name__ == "__main__":
    run_cli(__doc__, COMMANDS)
