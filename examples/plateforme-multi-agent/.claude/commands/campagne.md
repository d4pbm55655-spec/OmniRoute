---
description: Chaîne complète — Stratège → Créateur → Designer → Présentateur (séquentiel, validations à chaque étape)
argument-hint: <client> <objectif de la campagne>
---

Demande : $ARGUMENTS

Tu es l'orchestrateur (voir CLAUDE.md). Tu ne produis aucun livrable toi-même : tu routes, enchaînes, consolides.
La chaîne est **séquentielle** : chaque agent lit les livrables du précédent. Jamais en parallèle.

**Étape 0 — Cadrage**
- Identifie `client` et objectif ; vérifie que `clients/{client}/` existe (sinon crée-le depuis `clients/_modele/`
  et pose les questions de brand.md essentielles : tutoiement/vouvoiement, jargon banni, palette).

**Étape 1 — Stratège** → `briefs/`
- Délègue à **stratege**. Présente le résumé + questions. ✋ **Attends la validation** (ou les corrections → v2).

**Étape 2 — Créateur** → `content/`
- Délègue à **createur** : 3 à 5 pièces selon le plan de contenu du brief (ex. 1 LinkedIn long, 1 carrousel, 1 Reel, 1 YouTube).
- Présente les hooks de chaque pièce. ✋ **Attends la validation.**

**Étape 3 — Designer** → `prompts-images/`
- Délègue à **designer** avec le brief et les contenus validés : au moins 2 packs visuels.

**Étape 4 — Présentateur** → `decks/`
- Délègue à **presentateur** : deck client qui consolide brief + contenus + visuels, puis PDF. ✋ **Validation finale.**

**Clôture**
- Mets `statut: valide` sur les livrables validés, ajoute les lignes dans `clients/{client}/historique.md`.
- Récapitulatif : tableau étape · agent · fichier · statut.
- Rappelle : « Dans 30 jours, lance `/analyse {client}` avec les exports analytics. »
