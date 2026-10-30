---
description: Créateur → une pièce de contenu (LinkedIn, carrousel, Reel, TikTok, YouTube)
argument-hint: <client> <format> <sujet>
---

Demande : $ARGUMENTS

Tu es l'orchestrateur (voir CLAUDE.md).

1. Repère `client`, `format` (linkedin-long | linkedin-carrousel | reel | tiktok | youtube-long | youtube-short) et le sujet.
   Format absent ou ambigu → propose la liste et demande.
2. Cherche le brief le plus récent du client dans `briefs/`. S'il n'y en a pas, préviens que le contenu sera moins cadré
   et propose `/brief` d'abord ; continue si l'utilisateur le souhaite.
3. Délègue au sous-agent **createur** avec : client, format, sujet, chemin du brief.
4. Affiche le chemin du fichier, les 2 hooks et le framework utilisé. Demande la validation.
