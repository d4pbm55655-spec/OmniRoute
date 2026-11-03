#!/usr/bin/env node
// Agent IA « Historien du football belge » — propulsé par OmniRoute.
//
// Pipeline : questions de recherche → POST /v1/search (plusieurs requêtes, sources dédupliquées)
//            → POST /v1/chat/completions (persona historien + sources numérotées)
//            → article Markdown sourcé.
//
// Usage :
//   node historian.mjs joueur  "Paul Van Himst"
//   node historian.mjs staff   "Raymond Goethals"
//   node historian.mjs equipe  "Standard de Liège"
//   node historian.mjs amateur "RFC Huy"
//   node historian.mjs semaine                      # semaine en cours
//   node historian.mjs semaine "Nationale 1" --out recap.md
//
// Variables d'environnement :
//   OMNIROUTE_URL      (défaut http://localhost:20128/v1)
//   OMNIROUTE_API_KEY  (défaut "dummy-key")
//   HISTORIAN_MODEL    (défaut "auto")
//   HISTORIAN_SEARCH_PROVIDER (optionnel, ex. "tavily-search", "brave-search")

import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.mjs";

export const MODES = ["joueur", "staff", "equipe", "amateur", "semaine"];

/** Divisions couvertes par le récap hebdomadaire quand aucun sujet n'est donné. */
export const DIVISIONS_SEMAINE = [
  "Jupiler Pro League",
  "Challenger Pro League",
  "Nationale 1",
  "Division 2 ACFF",
  "Division 2 VV",
  "Division 3 ACFF",
  "Division 3 VV",
  "Super League féminine",
];

const MAX_TEXT_PER_SOURCE = 2500;

/**
 * Génère les requêtes de recherche pour un mode donné.
 * Les requêtes mélangent français et néerlandais pour couvrir toute la presse belge.
 */
export function buildQueries(mode, sujet = "") {
  const s = sujet.trim();
  switch (mode) {
    case "joueur":
      return [
        `${s} footballeur carrière Belgique`,
        `${s} statistiques saison par saison buts matchs`,
        `${s} voetballer carrière België`,
        `${s} histoire anecdotes interview`,
        `${s} transferts palmarès`,
      ];
    case "staff":
      return [
        `${s} entraîneur carrière Belgique`,
        `${s} bilan victoires défaites club belge`,
        `${s} trainer België carrière`,
        `${s} méthodes style de jeu anecdotes`,
      ];
    case "equipe":
      return [
        `${s} histoire du club matricule fondation`,
        `${s} palmarès titres coupe de Belgique`,
        `${s} geschiedenis club`,
        `${s} classement saison actuelle`,
        `${s} joueurs légendaires entraîneurs emblématiques`,
      ];
    case "amateur":
      return [
        `${s} football amateur Belgique`,
        `${s} ACFF Voetbal Vlaanderen série classement`,
        `${s} résultats derniers matchs`,
        `${s} histoire du club matricule`,
      ];
    case "semaine": {
      const divisions = s ? [s] : DIVISIONS_SEMAINE;
      return divisions.map((d) => `${d} résultats journée cette semaine`);
    }
    default:
      throw new Error(`Mode inconnu : ${mode}. Modes valides : ${MODES.join(", ")}`);
  }
}

/** Supprime les doublons (même URL) et normalise les champs utiles d'un résultat /v1/search. */
export function dedupeSources(results) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (!r?.url || seen.has(r.url)) continue;
    seen.add(r.url);
    const raw = r.content?.text || r.snippet || "";
    out.push({
      title: r.title || r.url,
      url: r.url,
      published_at: r.published_at || null,
      text: raw.length > MAX_TEXT_PER_SOURCE ? `${raw.slice(0, MAX_TEXT_PER_SOURCE)}…` : raw,
    });
  }
  return out;
}

function config(env = process.env) {
  return {
    baseUrl: (env.OMNIROUTE_URL || "http://localhost:20128/v1").replace(/\/$/, ""),
    apiKey: env.OMNIROUTE_API_KEY || "dummy-key",
    model: env.HISTORIAN_MODEL || "auto",
    searchProvider: env.HISTORIAN_SEARCH_PROVIDER || undefined,
  };
}

async function postJson(fetchImpl, url, apiKey, body) {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${url} → HTTP ${res.status} ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/** Lance toutes les recherches ; une recherche en échec n'arrête pas l'agent. */
export async function research(mode, sujet, { fetchImpl = fetch, env = process.env } = {}) {
  const cfg = config(env);
  const weekly = mode === "semaine";
  const queries = buildQueries(mode, sujet);
  const settled = await Promise.allSettled(
    queries.map((query) =>
      postJson(fetchImpl, `${cfg.baseUrl}/search`, cfg.apiKey, {
        query,
        max_results: weekly ? 6 : 5,
        search_type: weekly ? "news" : "web",
        country: "BE",
        language: "fr",
        ...(weekly ? { time_range: "week" } : {}),
        ...(cfg.searchProvider ? { provider: cfg.searchProvider } : {}),
      })
    )
  );
  const errors = [];
  const results = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") results.push(...(s.value?.results || []));
    else errors.push(`« ${queries[i]} » : ${s.reason?.message || s.reason}`);
  });
  return { sources: dedupeSources(results), errors };
}

/** Exécute l'agent complet et renvoie l'article Markdown. */
export async function runHistorian(mode, sujet = "", opts = {}) {
  if (!MODES.includes(mode)) {
    throw new Error(`Mode inconnu : ${mode}. Modes valides : ${MODES.join(", ")}`);
  }
  if (mode !== "semaine" && !sujet.trim()) {
    throw new Error(`Le mode « ${mode} » demande un sujet (nom du joueur, du club…).`);
  }
  const { fetchImpl = fetch, env = process.env, today = new Date() } = opts;
  const cfg = config(env);
  const label =
    mode === "semaine"
      ? `${sujet.trim() || "football belge pro et amateur"} — semaine du ${today
          .toISOString()
          .slice(0, 10)}`
      : sujet.trim();

  const { sources, errors } = await research(mode, sujet, { fetchImpl, env });

  const completion = await postJson(fetchImpl, `${cfg.baseUrl}/chat/completions`, cfg.apiKey, {
    model: cfg.model,
    stream: false,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(mode, label, sources) },
    ],
  });
  const article = completion?.choices?.[0]?.message?.content?.trim() || "";
  return { article, sources, errors };
}

function parseArgs(argv) {
  const args = [...argv];
  let out;
  const i = args.indexOf("--out");
  if (i !== -1) {
    out = args[i + 1];
    args.splice(i, 2);
  }
  const [mode, ...rest] = args;
  return { mode, sujet: rest.join(" "), out };
}

async function main() {
  const { mode, sujet, out } = parseArgs(process.argv.slice(2));
  if (!mode || mode === "--help" || mode === "-h") {
    console.log(`Usage : node historian.mjs <${MODES.join("|")}> [sujet] [--out fichier.md]`);
    return;
  }
  const { article, sources, errors } = await runHistorian(mode, sujet);
  for (const e of errors) console.error(`⚠️  recherche échouée ${e}`);
  console.error(`📚 ${sources.length} source(s) utilisée(s)`);
  if (out) {
    await writeFile(out, `${article}\n`, "utf8");
    console.error(`✅ Article écrit dans ${out}`);
  } else {
    console.log(article);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  });
}
