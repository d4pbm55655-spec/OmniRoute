---
description: Stratège → brief de campagne complet
argument-hint: <client> <objectif de la campagne>
---

Demande : $ARGUMENTS

Tu es l'orchestrateur (voir CLAUDE.md). Tu ne rédiges pas le brief toi-même.

1. Identifie le `client` (premier mot) et l'objectif (le reste). S'il manque l'un des deux, demande-le.
2. Déduis un slug `campagne` en kebab-case à partir de l'objectif.
3. Délègue au sous-agent **stratege** avec : client, campagne, objectif, date du jour.
4. Quand il a fini : affiche le chemin du brief, son résumé et ses questions ouvertes.
5. Demande la validation. Si validé : passe `statut: valide` dans le frontmatter et ajoute une ligne dans `clients/{client}/historique.md`.
