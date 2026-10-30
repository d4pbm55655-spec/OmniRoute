# Plateforme Multi-Agent Marketing

Une équipe marketing IA dans Claude Code : 1 orchestrateur, 5 agents métier, 3 agents support,
des livrables markdown versionnés comme mémoire partagée.

```
                 ORCHESTRATEUR (Claude Code + CLAUDE.md)
      ┌──────────┬──────────┬──────────┬──────────┬──────────────┐
   Stratège   Créateur   Designer   Analyste   Présentateur    + Gmail · Fireflies · CV
    (opus)    (sonnet)   (sonnet)    (opus)     (sonnet)
   briefs/    content/  prompts-   analytics/   decks/
                         images/
```

## Démarrage (5 minutes)

1. **Ouvrir le dossier dans Claude Code** : `cd plateforme-multi-agent && claude`
   Claude lit `CLAUDE.md` automatiquement, les agents (`.claude/agents/`) et commandes (`.claude/commands/`) sont chargés.
2. **Créer ton client** : copie `clients/_modele/` vers `clients/<ton-client>/` et remplis `brand.md` + `icp.md`
   (un client fictif `clients/demo/` sert d'exemple).
3. **Lancer une campagne** :
   ```
   /campagne <ton-client> lancer ma chaîne TikTok sur …
   ```
   La chaîne s'arrête pour validation après le brief, après les contenus et après le deck.

## Commandes

| Commande | Agent |
|---|---|
| `/brief <client> <objectif>` | Stratège |
| `/post <client> <format> <sujet>` | Créateur (`linkedin-long`, `linkedin-carrousel`, `reel`, `tiktok`, `youtube-long`, `youtube-short`) |
| `/visuel <client> <fichier ou sujet>` | Designer |
| `/analyse <client> [période]` | Analyste (dépose tes exports dans `analytics/exports/`) |
| `/deck <client> <source>` | Présentateur |
| `/campagne <client> <objectif>` | Chaîne complète |

Les agents support s'appellent en langage naturel : « trie ma boîte mail », « analyse ce call », « score ces CV ».

## Optionnel

**Clés API** : `cp .env.example .env` puis remplir. Sans clé, tout tourne en mode stub (rien n'est publié, aucun chiffre inventé).
Gemini (génération d'images) est branché pour de vrai ; les autres scripts de `api/` ont un `TODO` à l'endroit de l'appel réel.

**Backend** (depuis la racine) :
```bash
pip install -r api/requirements.txt
uvicorn api.server:app --port 8000
```

**Dashboard** :
```bash
cd dashboard
npm install
npm run dev            # → http://localhost:3000
npm run pdf -- ../decks/2026-10-30-demo-exemple-pitch.md   # export PDF en ligne de commande
```
Le dashboard liste les livrables par agent, les affiche, génère les PDF (deck 1920×1080 / A4, rapports) et les PNG de carrousels,
et propose un chat (mettre `ANTHROPIC_API_KEY` dans `dashboard/.env.local`).

## Arborescence

```
CLAUDE.md                 contrat : roster, conventions, règles bloquantes
.claude/agents/           8 agents (stratege, createur, designer, analyste, presentateur, gmail, fireflies, cv)
.claude/commands/         6 slash commands
.claude/settings.json     permissions (scripts api/ et export PDF uniquement)
clients/                  mémoire client (brand.md, icp.md, historique.md)
templates/                modèles de livrables avec frontmatter YAML
briefs/ content/ prompts-images/ analytics/ decks/ gmail/ meetings/ hiring/
api/                      stubs Python + backend FastAPI
dashboard/                Next.js + Tailwind 4 + AI SDK + Puppeteer
```

## Règles qui font tenir le système

- L'orchestrateur ne produit jamais un livrable lui-même.
- Chaque livrable a un frontmatter YAML (client, campagne, agent, date, version, statut) : un fichier = un auteur.
- `brand.md` est lu avant chaque production ; ses interdictions sont bloquantes.
- Aucun chiffre inventé : « donnée manquante » est une réponse valide.
- Séquentiel, pas parallèle.
