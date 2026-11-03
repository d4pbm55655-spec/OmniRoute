# Agent IA « Historien du football belge »

Agent qui alimente la rubrique **Histoire** d'un site sur le football belge. Il passe par
OmniRoute : `POST /v1/search` pour la recherche web, `POST /v1/chat/completions` pour la rédaction.

## Ce qu'il fait

| Mode      | Rôle                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `joueur`  | Recherche un joueur passé par la Belgique : parcours, stats saison par saison, analyse, anecdotes      |
| `staff`   | Recherche un entraîneur ou un membre de staff : carrière, bilan chiffré, méthodes, histoires           |
| `equipe`  | Dossier d'un club : matricule, fondation, palmarès, grandes périodes, figures du club, saison en cours |
| `amateur` | Football amateur : club, série ou division (Nationale 1, D2/D3 ACFF et VV, Provinciales)               |
| `semaine` | Récap hebdomadaire des matchs (pro et amateur) : résultats, résumés, impact sur le classement          |

L'agent suit des règles d'historien : chaque fait est relié à une source numérotée (`[1]`,
`[2]`…), une info absente ou contradictoire est signalée, rien n'est inventé, et les faits sont
séparés de l'analyse. Le persona se trouve dans [`prompts.mjs`](prompts.mjs).

## Prérequis

- Node.js 22 ou plus récent (aucune dépendance : il utilise `fetch` natif)
- Un serveur OmniRoute démarré (`npx omniroute`) avec :
  - au moins un fournisseur de **recherche** configuré (Tavily, Brave, Serper, Exa…), ou
    `duckduckgo-free` ;
  - au moins un modèle de **chat**.

## Utilisation

```bash
cd examples/belgian-football-historian

node historian.mjs joueur  "Paul Van Himst"
node historian.mjs staff   "Raymond Goethals"
node historian.mjs equipe  "Standard de Liège"
node historian.mjs amateur "RFC Huy"

# Récap de la semaine : toutes les divisions par défaut, ou une seule
node historian.mjs semaine
node historian.mjs semaine "Nationale 1" --out recap-n1.md
```

Avec `--out`, l'article Markdown est écrit dans un fichier. Sinon il s'affiche dans le terminal.

## Configuration

| Variable                    | Défaut                      | Rôle                                                    |
| --------------------------- | --------------------------- | ------------------------------------------------------- |
| `OMNIROUTE_URL`             | `http://localhost:20128/v1` | URL de base de l'API OmniRoute                          |
| `OMNIROUTE_API_KEY`         | `dummy-key`                 | Clé API OmniRoute                                       |
| `HISTORIAN_MODEL`           | `auto`                      | Modèle ou combo utilisé pour la rédaction               |
| `HISTORIAN_SEARCH_PROVIDER` | _(auto)_                    | Force un fournisseur de recherche (ex. `tavily-search`) |

## Récap automatique chaque semaine

Une tâche planifiée (cron) suffit, par exemple chaque lundi à 8 h :

```cron
0 8 * * 1  cd /chemin/vers/examples/belgian-football-historian && node historian.mjs semaine --out "/chemin/site/contenu/recap-$(date +\%Y-\%m-\%d).md"
```

## Intégration dans votre code

```js
import { runHistorian } from "./historian.mjs";

const { article, sources, errors } = await runHistorian("joueur", "Jan Ceulemans");
// article : Markdown prêt à publier ; sources : liste { title, url, published_at, text }
```

## Limites

- La qualité des statistiques dépend des sources renvoyées par la recherche. Pour des chiffres
  officiels, ajoutez vos propres sources (base du site, archives) à la liste `sources` avant la
  rédaction.
- Relisez chaque article avant de le publier : l'agent signale ses incertitudes, mais il peut
  quand même se tromper.
