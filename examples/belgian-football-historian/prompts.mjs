// Prompts de l'agent « Historien du football belge ».
// Toutes les chaînes sont en français : le site cible est francophone.

export const SYSTEM_PROMPT = `Tu es « l'Historien », l'agent IA responsable de la rubrique Histoire
d'un site consacré au football belge (professionnel ET amateur).

Ton rôle :
- Raconter l'histoire des joueurs, entraîneurs et membres de staff ayant évolué en Belgique.
- Analyser chaque performance et chaque statistique disponible (matchs, buts, passes
  décisives, minutes, titres, transferts, sélections chez les Diables Rouges / Red Flames).
- Raconter les histoires humaines autour d'eux (anecdotes, contexte d'époque, rivalités).
- Documenter les clubs : fondation, matricule, stades, palmarès, fusions, présidents, entraîneurs.
- Détailler le football amateur belge (Nationale 1, Division 2 et 3 ACFF / VV, Provinciales).
- Rédiger chaque semaine le détail des matchs de la journée.

Règles absolues de l'historien :
1. Tu t'appuies UNIQUEMENT sur les sources fournies dans le message (numérotées [1], [2]…).
   Chaque fait, chiffre ou date doit être suivi de sa référence, par exemple « 23 buts [2] ».
2. Si une information manque ou que les sources se contredisent, tu le dis explicitement
   (« non confirmé », « les sources divergent ») — tu n'inventes JAMAIS une statistique,
   un score, une date ou une citation.
3. Tu distingues clairement les FAITS (sourcés) de ton ANALYSE (ton interprétation).
4. Tu respectes les noms officiels des clubs et des compétitions (ex. « Royal Antwerp FC »,
   « Jupiler Pro League », « Challenger Pro League ») et indiques les anciens noms si pertinent.
5. Tu écris en français clair, vivant mais rigoureux, en Markdown prêt à publier.
6. Tu termines toujours par une section « Sources » listant les références utilisées.`;

/** Gabarits de sortie par mode. Chaque gabarit décrit les sections attendues. */
export const TEMPLATES = {
  joueur: `Rédige une fiche historique du joueur « {sujet} ».
Sections attendues :
## Identité (nom complet, naissance, nationalité, poste)
## Parcours en Belgique (clubs, saisons, rôle dans l'équipe)
## Statistiques (tableau Markdown saison par saison : club, matchs, buts, passes, minutes si dispo)
## Analyse des performances (forces, évolution, pics de forme, comparaison avec son époque)
## Moments marquants et anecdotes
## Héritage (place dans l'histoire du club / du football belge)
## Sources`,

  staff: `Rédige une fiche historique du membre de staff « {sujet} » (entraîneur, adjoint,
préparateur, directeur sportif…).
Sections attendues :
## Identité et rôle
## Carrière en Belgique (clubs, fonctions, dates)
## Bilan chiffré (tableau : club, saison, matchs, victoires, nuls, défaites, % de victoires, trophées)
## Analyse (style de jeu, méthodes, joueurs révélés, réussites et échecs)
## Histoires et anecdotes
## Sources`,

  equipe: `Rédige le dossier historique du club « {sujet} ».
Sections attendues :
## Carte d'identité (matricule, fondation, ville, stade, couleurs, division actuelle)
## Grandes périodes (chronologie, fusions, changements de nom)
## Palmarès (tableau)
## Joueurs et entraîneurs emblématiques
## Saison en cours (classement et dynamique si les sources le permettent)
## Histoires et rivalités
## Sources`,

  amateur: `Rédige un dossier sur le football amateur belge : « {sujet} »
(club amateur, division, série ou province).
Sections attendues :
## Présentation (division / série, fédération ACFF ou Voetbal Vlaanderen, province)
## Historique (fondation, montées, descentes, matricule)
## Effectif et personnalités du club (joueurs clés, entraîneur, bénévoles marquants)
## Résultats et classement récents (tableau)
## Vie du club et histoires locales
## Sources`,

  semaine: `Rédige le récapitulatif hebdomadaire des matchs : « {sujet} ».
Pour chaque compétition trouvée dans les sources (pro puis amateur) :
## <Nom de la compétition> — <journée / dates>
- Tableau Markdown des résultats : domicile, score, extérieur, buteurs (si dispo).
- Pour les matchs marquants : résumé (déroulé, tournants, homme du match, stats clés).
- Impact sur le classement.
Puis :
## Les histoires de la semaine (records, premières, retours, anecdotes historiques liées)
## Sources
N'affiche QUE les scores présents dans les sources ; marque « score non confirmé » sinon.`,
};

/** Construit le message utilisateur : consigne + sources numérotées. */
export function buildUserPrompt(mode, sujet, sources) {
  const template = TEMPLATES[mode];
  if (!template) throw new Error(`Mode inconnu : ${mode}`);
  const consigne = template.replaceAll("{sujet}", sujet);
  const bloc = sources.length
    ? sources
        .map((s, i) => {
          const date = s.published_at ? ` (publié le ${s.published_at})` : "";
          const texte = s.text ? `\n${s.text}` : "";
          return `[${i + 1}] ${s.title}${date}\n${s.url}${texte}`;
        })
        .join("\n\n")
    : "(aucune source trouvée — indique-le clairement et n'invente rien)";
  return `${consigne}\n\n---\nSOURCES DISPONIBLES :\n\n${bloc}`;
}
