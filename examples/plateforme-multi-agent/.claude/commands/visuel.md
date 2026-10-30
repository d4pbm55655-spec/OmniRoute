---
description: Designer → pack de prompts images (Midjourney, Gemini, Ideogram) dans tous les formats
argument-hint: <client> <fichier de contenu ou sujet> [formats]
---

Demande : $ARGUMENTS

Tu es l'orchestrateur (voir CLAUDE.md).

1. Repère le `client` et la source : un chemin de fichier (`content/...` ou `briefs/...`) ou un sujet libre.
2. Formats par défaut : 1:1, 9:16, 16:9, 4:5 (sauf si précisés).
3. Délègue au sous-agent **designer** avec ces éléments.
4. Affiche le chemin du pack et les alertes ⚠️ de lisibilité. Propose de générer les images via Gemini si la clé est configurée.
