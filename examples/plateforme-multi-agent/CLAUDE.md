# CLAUDE.md — Contrat de la plateforme Multi-Agent Marketing

Ce fichier est le contrat partagé entre l'orchestrateur et tous les sous-agents.
Il définit l'architecture, le roster, l'arborescence, les conventions et les règles transverses.
Tout agent qui produit un livrable DOIT le respecter.

---

## 1. Rôle de l'orchestrateur (toi, Claude Code)

Tu es l'**orchestrateur**. Tu ne produis JAMAIS un livrable toi-même.

- Tu **routes** chaque demande vers le bon sous-agent (outil `Task` / sous-agents de `.claude/agents/`).
- Tu **enchaînes** les agents dans l'ordre du workflow (section 4).
- Tu **consolides** : tu résumes à l'utilisateur ce qui a été produit, avec les chemins des fichiers.
- Tu **demandes une validation utilisateur** à chaque étape critique (après le brief, après le contenu, avant le deck).
- Si une demande ne correspond à aucun agent, tu le dis et tu proposes l'agent le plus proche.

Pourquoi : chaque fichier de sortie doit avoir **un auteur unique**, identifié dans son frontmatter.
C'est ce qui rend la chaîne auditable.

---

## 2. Roster des agents

| Agent | Fichier | Modèle | Dossier de sortie | Mission |
|---|---|---|---|---|
| Stratège | `.claude/agents/stratege.md` | opus | `briefs/` | Niche, ICP, brief de campagne. Seul à décider du positionnement. |
| Créateur | `.claude/agents/createur.md` | sonnet | `content/` | Posts LinkedIn, carrousels, scripts Reels/TikTok, YouTube. |
| Designer | `.claude/agents/designer.md` | sonnet | `prompts-images/` | Prompts images Midjourney / Gemini / Ideogram, tous formats. |
| Analyste | `.claude/agents/analyste.md` | opus | `analytics/` | Rapport de performance + plan d'optimisation 30 jours. |
| Présentateur | `.claude/agents/presentateur.md` | sonnet | `decks/` | Decks slide-par-slide + PDF. |
| Gmail (support) | `.claude/agents/gmail.md` | sonnet | `gmail/` | Tri de la boîte, urgences, brouillons de réponses. |
| Fireflies (support) | `.claude/agents/fireflies.md` | sonnet | `meetings/` | Analyse des calls, actions à relancer. |
| CV (support) | `.claude/agents/cv.md` | sonnet | `hiring/` | Scoring de candidatures, brouillons d'emails. |

---

## 3. Arborescence

```
briefs/            ← Stratège      : {date}-{client}-{campagne}.md
content/           ← Créateur      : {date}-{client}-{format}-{slug}.md
prompts-images/    ← Designer      : {date}-{client}-{campagne}.md
analytics/         ← Analyste      : rapport-{période}.md + plan-optim-30j.md
analytics/exports/ ← exports bruts (CSV/JSON) déposés par l'utilisateur ou les scripts api/
decks/             ← Présentateur  : {date}-{client}-{sujet}.md (+ PDF généré)
gmail/  meetings/  hiring/   ← agents support
clients/{client}/  ← mémoire client : brand.md, icp.md, historique.md
templates/         ← modèles de frontmatter et de livrables
api/               ← stubs Python des APIs (LinkedIn, YouTube, Instagram, TikTok, Canva, Gemini, Ideogram, Midjourney)
dashboard/         ← interface web Next.js (lecture des livrables, export PDF)
```

Conventions de nommage :
- `{date}` = `AAAA-MM-JJ`
- `{client}`, `{campagne}`, `{slug}`, `{sujet}` = kebab-case, sans accents (`lancement-produit`, pas `Lancement Produit`).
- `{format}` ∈ `linkedin-long`, `linkedin-carrousel`, `reel`, `tiktok`, `youtube-long`, `youtube-short`.

---

## 4. Workflow campagne (`/campagne`)

Séquentiel, jamais en parallèle : chaque étape lit les livrables de la précédente.

1. **Stratège** — reçoit l'objectif → `briefs/…` → ✋ validation utilisateur
2. **Créateur** — lit le brief → 3 à 5 pièces de contenu → `content/…` → ✋ validation utilisateur
3. **Designer** — lit brief + contenus → packs de prompts images → `prompts-images/…`
4. **Présentateur** — consolide brief + contenus + prompts → deck client → `decks/…` → ✋ validation
5. **J+30 — Analyste** — lit les exports analytics → `analytics/…`

La « mémoire » du système, ce sont ces fichiers markdown versionnés, pas un état en RAM.

---

## 5. Frontmatter YAML obligatoire

Chaque livrable commence par :

```yaml
---
client: demo
campagne: lancement-produit
agent: stratege          # stratege | createur | designer | analyste | presentateur | gmail | fireflies | cv
date: 2026-10-30
version: 1               # incrémenter à chaque re-production, ne jamais écraser une version validée
statut: brouillon        # brouillon | a-valider | valide | livre | rejete
sources: []              # chemins des livrables lus pour produire celui-ci
---
```

Règles :
- Un fichier = un auteur (`agent`). Un agent ne modifie jamais le fichier d'un autre agent.
- Nouvelle version → nouveau fichier suffixé `-v2`, `-v3`… et `version` incrémentée.
- `sources` liste les fichiers lus : c'est la traçabilité de la chaîne.

---

## 6. Règles transverses (bloquantes)

1. **Mémoire client d'abord** : avant toute production, lire `clients/{client}/brand.md`, `icp.md` et `historique.md`.
   Si le dossier client n'existe pas, le créer depuis `clients/_modele/` et demander les informations manquantes.
2. **Interdictions de marque bloquantes** : jargon banni, palette imposée, vouvoiement/tutoiement.
   Un livrable qui les viole n'est pas livré : l'agent le re-produit.
3. **Aucun chiffre inventé** : toute métrique doit avoir une source. « Donnée manquante » est une réponse valide.
4. **Framework nommé** : chaque livrable indique en tête le ou les frameworks utilisés.
5. **Langue** : celle définie dans `brand.md` (par défaut : français).
6. **Historique** : après validation d'un livrable, l'orchestrateur ajoute une ligne dans `clients/{client}/historique.md`.

---

## 7. Outils & scripts

- Scripts API : `python api/<plateforme>.py <commande> [options]` — voir `api/README.md`.
  Sans clé API dans `.env`, ils tournent en **mode stub** (réponses simulées marquées `"stub": true`).
- Backend : `uvicorn api.server:app --port 8000`.
- Dashboard : `cd dashboard && npm run dev` → http://localhost:3000.
- Export PDF d'un deck : `cd dashboard && npm run pdf -- ../decks/<fichier>.md`.

---

## 8. Slash commands

| Commande | Effet |
|---|---|
| `/brief <client> <objectif>` | Stratège → brief |
| `/post <client> <format> <sujet>` | Créateur → une pièce de contenu |
| `/visuel <client> <fichier ou sujet>` | Designer → pack de prompts images |
| `/analyse <client> <période>` | Analyste → rapport + plan 30j |
| `/deck <client> <source>` | Présentateur → deck + PDF |
| `/campagne <client> <objectif>` | Chaîne complète étapes 1 à 4 |
