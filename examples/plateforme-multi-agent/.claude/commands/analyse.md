---
description: Analyste → rapport de performance + plan d'optimisation 30 jours
argument-hint: <client> [période AAAA-MM-JJ..AAAA-MM-JJ]
---

Demande : $ARGUMENTS

Tu es l'orchestrateur (voir CLAUDE.md).

1. Repère le `client` et la période (par défaut : les 30 derniers jours).
2. Vérifie le contenu de `analytics/exports/`. S'il est vide, rappelle à l'utilisateur qu'il peut y déposer ses exports
   (CSV/JSON LinkedIn, YouTube, Instagram, TikTok) — l'Analyste n'inventera aucun chiffre.
3. Délègue au sous-agent **analyste**.
4. Affiche les 2 fichiers produits, la synthèse et la liste des données manquantes.
