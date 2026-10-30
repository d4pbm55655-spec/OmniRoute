# api/ — stubs des plateformes

Tous les scripts fonctionnent **sans clé** (mode stub : aucune requête, réponse `"stub": true`).
Dès qu'une clé est mise dans `.env`, l'appel réel est utilisé (Gemini est déjà branché ;
les autres ont un `TODO` clair à l'endroit où brancher l'appel).

| Script | Commandes | Clé `.env` |
|---|---|---|
| `linkedin.py` | `publish`, `analytics` | `LINKEDIN_ACCESS_TOKEN` |
| `youtube.py` | `publish`, `analytics` | `YOUTUBE_API_KEY` |
| `instagram.py` | `publish`, `analytics` | `INSTAGRAM_ACCESS_TOKEN` |
| `tiktok.py` | `publish`, `analytics` | `TIKTOK_ACCESS_TOKEN` |
| `canva.py` | `create` | `CANVA_ACCESS_TOKEN` |
| `gemini.py` | `image` (**réel**) | `GEMINI_API_KEY` |
| `ideogram.py` | `image` | `IDEOGRAM_API_KEY` |
| `midjourney.py` | `format` (pas d'API officielle : prompt prêt à coller) | — |

Exemples :

```bash
python api/linkedin.py analytics --since 2026-10-01 --until 2026-10-30
python api/gemini.py image --prompt "bureau de PME, lumière naturelle" --aspect 16:9 --name hero
python api/midjourney.py format --prompt "..." --aspect 9:16 --no "robot, binary code"
```

Règles :
- Les stubs **n'inventent jamais de métriques** : `analytics` en mode stub renvoie `metrics: null`.
- Aucune publication réelle sans validation explicite de l'utilisateur.

Backend : `pip install -r api/requirements.txt` puis `uvicorn api.server:app --port 8000` (depuis la racine).
