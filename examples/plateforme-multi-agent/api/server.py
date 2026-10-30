"""Backend FastAPI — expose les stubs API au dashboard (port 8000).

Lancer depuis la racine du projet :
  uvicorn api.server:app --port 8000 --reload
"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, get_key, today  # noqa: E402

SOCIAL = {"linkedin", "youtube", "instagram", "tiktok"}
INTEGRATIONS = {
    "gmail": ("GMAIL_OAUTH_TOKEN", "gmail"),
    "drive": ("GOOGLE_DRIVE_OAUTH_TOKEN", None),
    "fireflies": ("FIREFLIES_API_KEY", "meetings"),
    "youtube": ("YOUTUBE_API_KEY", "analytics/exports"),
}

app = FastAPI(title="Plateforme Multi-Agent — backend", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])


class PublishIn(BaseModel):
    text: str
    media: str | None = None
    schedule: str | None = None


class ImageIn(BaseModel):
    prompt: str
    aspect: str = "1:1"
    name: str | None = None


def _mod(name: str):
    return importlib.import_module(name)


@app.get("/health")
def health() -> dict:
    keys = ["LINKEDIN_ACCESS_TOKEN", "YOUTUBE_API_KEY", "INSTAGRAM_ACCESS_TOKEN", "TIKTOK_ACCESS_TOKEN",
            "CANVA_ACCESS_TOKEN", "GEMINI_API_KEY", "IDEOGRAM_API_KEY", "FIREFLIES_API_KEY", "GMAIL_OAUTH_TOKEN"]
    return {"ok": True, "date": today(), "cles": {k: bool(get_key(k)) for k in keys}}


@app.post("/publish/{platform}")
def publish(platform: str, body: PublishIn) -> dict:
    if platform not in SOCIAL:
        raise HTTPException(404, f"Plateforme inconnue : {platform}")
    return _mod(platform).publish(body.text, body.media, body.schedule)


@app.get("/analytics/{platform}")
def analytics(platform: str, since: str, until: str) -> dict:
    if platform not in SOCIAL:
        raise HTTPException(404, f"Plateforme inconnue : {platform}")
    return _mod(platform).analytics(since, until)


@app.post("/images/gemini")
def gemini_image(body: ImageIn) -> dict:
    return _mod("gemini").image(body.prompt, body.aspect, body.name)


@app.post("/integrations/{service}/sync")
def sync(service: str) -> dict:
    if service not in INTEGRATIONS:
        raise HTTPException(404, f"Intégration inconnue : {service}")
    key, folder = INTEGRATIONS[service]
    if not get_key(key):
        return {"stub": True, "service": service,
                "message": f"Mode stub : renseigne {key} dans .env.", "dossier_cible": folder}
    return {"stub": False, "service": service, "error": "Synchronisation réelle pas encore branchée",
            "a_faire": f"Implémenter la synchro {service} → {folder or '?'} dans api/server.py"}


@app.get("/livrables")
def livrables() -> dict:
    out: dict[str, list[str]] = {}
    for d in ["briefs", "content", "prompts-images", "analytics", "decks", "gmail", "meetings", "hiring"]:
        out[d] = sorted(str(p.relative_to(ROOT)) for p in (ROOT / d).glob("*.md"))
    return out
