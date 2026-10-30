import fs from "node:fs";
import matter from "gray-matter";
import { cheminSur, PROJECT_ROOT } from "./livrables";
import { themeFromBrand } from "./render.mjs";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export function erreur(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Charge un livrable depuis {chemin} ou accepte {markdown, client} directement. */
export async function chargerSource(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { chemin?: string; markdown?: string; client?: string; format?: string };
  if (body.chemin) {
    const abs = cheminSur(body.chemin);
    const { data, content } = matter(fs.readFileSync(abs, "utf8"));
    return { abs, data: data as Record<string, unknown>, content, body, theme: themeFromBrand(PROJECT_ROOT, data.client) };
  }
  if (body.markdown) {
    const { data, content } = matter(body.markdown);
    const d = { ...data, client: data.client ?? body.client };
    return { abs: null, data: d as Record<string, unknown>, content, body, theme: themeFromBrand(PROJECT_ROOT, d.client) };
  }
  throw new Error("Fournir { chemin } (relatif à la racine du projet) ou { markdown }.");
}

export function pdfResponse(pdf: Buffer, nom: string) {
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${nom}"` },
  });
}
