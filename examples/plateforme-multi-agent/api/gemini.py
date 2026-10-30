"""API Gemini (génération d'images « Nano Banana ») — appel RÉEL si GEMINI_API_KEY est défini.

Usage :
  python api/gemini.py image --prompt "..." [--aspect 1:1] [--name nom-fichier]
"""
from __future__ import annotations

import base64
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import MEDIA, ROOT, get_key, http_json, is_stub, run_cli, stub, today  # noqa: E402

PLATFORM = "gemini"
KEYS = ["GEMINI_API_KEY"]
ASPECTS = ["1:1", "9:16", "16:9", "4:5", "3:4", "4:3"]


def image(prompt: str, aspect: str = "1:1", name: str | None = None) -> dict:
    """Génère une image et l'enregistre dans prompts-images/media/."""
    payload = {"prompt": prompt, "aspect": aspect}
    if is_stub(*KEYS):
        return stub(PLATFORM, "image", payload, KEYS)
    model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}},
    }
    data = http_json(url, body, {"x-goog-api-key": get_key("GEMINI_API_KEY") or ""})
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    imgs = [p["inlineData"] for p in parts if "inlineData" in p]
    if not imgs:
        return {"error": "Aucune image renvoyée", "raw": data}
    MEDIA.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, img in enumerate(imgs):
        ext = img.get("mimeType", "image/png").split("/")[-1]
        path = MEDIA / f"{today()}-{name or 'gemini'}-{aspect.replace(':', 'x')}-{i + 1}.{ext}"
        path.write_bytes(base64.b64decode(img["data"]))
        saved.append(str(path.relative_to(ROOT)))
    return {"stub": False, "platform": PLATFORM, "fichiers": saved}


COMMANDS = {
    "image": (image, [
        ("--prompt", {"required": True}),
        ("--aspect", {"default": "1:1", "choices": ASPECTS}),
        ("--name", {"default": None}),
    ]),
}

if __name__ == "__main__":
    run_cli(__doc__, COMMANDS)
