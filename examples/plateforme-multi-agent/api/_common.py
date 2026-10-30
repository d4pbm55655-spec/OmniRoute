"""Helpers partagés par tous les stubs API.

- Charge le fichier .env à la racine du projet (sans dépendance externe).
- Mode STUB automatique quand la clé API est absente : aucune requête réseau,
  réponse simulée marquée "stub": true. Les stubs n'inventent JAMAIS de métriques.
- Sortie JSON sur stdout pour que les agents puissent la lire.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent.parent
EXPORTS = ROOT / "analytics" / "exports"
MEDIA = ROOT / "prompts-images" / "media"


def load_env(path: Path = ROOT / ".env") -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env()


def get_key(name: str) -> str | None:
    value = os.environ.get(name, "").strip()
    return value or None


def is_stub(*keys: str) -> bool:
    return any(get_key(k) is None for k in keys)


def today() -> str:
    return dt.date.today().isoformat()


def stub(platform: str, action: str, payload: dict[str, Any], missing: list[str], **extra: Any) -> dict[str, Any]:
    return {
        "stub": True,
        "platform": platform,
        "action": action,
        "message": f"Mode stub : renseigne {', '.join(missing)} dans .env pour activer l'appel réel.",
        "payload": payload,
        **extra,
    }


def analytics_stub(platform: str, since: str, until: str, missing: list[str]) -> dict[str, Any]:
    """Pas de chiffres inventés : on pointe vers les exports manuels éventuels."""
    exports = sorted(p.name for p in EXPORTS.glob(f"{platform}*")) if EXPORTS.exists() else []
    return stub(
        platform,
        "analytics",
        {"since": since, "until": until},
        missing,
        metrics=None,
        exports_disponibles=exports,
        consigne="Donnée manquante. Dépose un export CSV/JSON de la plateforme dans analytics/exports/ "
        f"(nommé {platform}-AAAA-MM-JJ.csv) pour que l'Analyste puisse travailler.",
    )


def not_wired(platform: str, action: str, doc: str) -> dict[str, Any]:
    return {
        "stub": False,
        "platform": platform,
        "action": action,
        "error": "Clé présente mais appel réel pas encore branché.",
        "a_faire": f"Implémenter l'appel dans api/{platform}.py — doc : {doc}",
    }


def http_json(url: str, body: dict | None = None, headers: dict | None = None, method: str | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method or ("POST" if data else "GET"))
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} : {e.read().decode(errors='replace')[:500]}") from e


def save_export(platform: str, data: Any) -> str:
    EXPORTS.mkdir(parents=True, exist_ok=True)
    path = EXPORTS / f"{platform}-{today()}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(path.relative_to(ROOT))


def emit(result: Any) -> None:
    print(json.dumps(result, ensure_ascii=False, indent=2))


def run_cli(description: str, commands: dict[str, tuple[Callable[..., Any], list[tuple[str, dict]]]]) -> None:
    """Petit routeur CLI : commands = {nom: (fonction, [(arg, kwargs argparse), ...])}."""
    parser = argparse.ArgumentParser(description=description)
    sub = parser.add_subparsers(dest="command", required=True)
    for name, (fn, args) in commands.items():
        p = sub.add_parser(name, help=(fn.__doc__ or "").strip().splitlines()[0] if fn.__doc__ else None)
        for arg, kwargs in args:
            p.add_argument(arg, **kwargs)
        p.set_defaults(_fn=fn)
    ns = vars(parser.parse_args())
    fn = ns.pop("_fn")
    ns.pop("command")
    try:
        emit(fn(**{k.replace("-", "_"): v for k, v in ns.items()}))
    except Exception as e:  # noqa: BLE001
        emit({"error": str(e)})
        sys.exit(1)


PERIOD_ARGS = [
    ("--since", {"default": (dt.date.today() - dt.timedelta(days=30)).isoformat(), "help": "AAAA-MM-JJ"}),
    ("--until", {"default": dt.date.today().isoformat(), "help": "AAAA-MM-JJ"}),
]
