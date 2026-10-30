import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const PROJECT_ROOT = process.env.PROJECT_ROOT ?? path.resolve(process.cwd(), "..");

export const AGENTS = [
  { id: "stratege", nom: "Stratège", modele: "Opus", dossier: "briefs", role: "Briefs, ICP, positionnement" },
  { id: "createur", nom: "Créateur", modele: "Sonnet", dossier: "content", role: "Posts, carrousels, scripts" },
  { id: "designer", nom: "Designer", modele: "Sonnet", dossier: "prompts-images", role: "Prompts images tous formats" },
  { id: "analyste", nom: "Analyste", modele: "Opus", dossier: "analytics", role: "Rapport + plan 30 jours" },
  { id: "presentateur", nom: "Présentateur", modele: "Sonnet", dossier: "decks", role: "Decks + PDF" },
  { id: "gmail", nom: "Gmail", modele: "Sonnet", dossier: "gmail", role: "Tri, urgences, brouillons", support: true },
  { id: "fireflies", nom: "Fireflies", modele: "Sonnet", dossier: "meetings", role: "Analyse des calls", support: true },
  { id: "cv", nom: "CV", modele: "Sonnet", dossier: "hiring", role: "Scoring candidatures", support: true },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

export type Livrable = {
  chemin: string; // relatif à la racine du projet
  titre: string;
  data: Record<string, unknown>;
};

function titreDe(content: string, fallback: string) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fallback;
}

/** Résout un chemin relatif en refusant toute sortie de la racine du projet. */
export function cheminSur(rel: string): string {
  const abs = path.resolve(PROJECT_ROOT, rel);
  if (!abs.startsWith(PROJECT_ROOT + path.sep)) throw new Error("Chemin refusé");
  return abs;
}

export function listerLivrables(agentId: AgentId): Livrable[] {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) return [];
  const dir = path.join(PROJECT_ROOT, agent.dossier);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse()
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return { chemin: `${agent.dossier}/${f}`, titre: titreDe(content, f), data };
    });
}

export function lireLivrable(rel: string) {
  const abs = cheminSur(rel);
  const { data, content } = matter(fs.readFileSync(abs, "utf8"));
  const pdf = abs.replace(/\.md$/, ".pdf");
  return { chemin: rel, data, content, titre: titreDe(content, path.basename(rel)), pdfExiste: fs.existsSync(pdf) };
}

export function compteurs() {
  return Object.fromEntries(AGENTS.map((a) => [a.id, listerLivrables(a.id).length])) as Record<AgentId, number>;
}

export function fmt(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.join(", ");
  return String(v ?? "");
}
