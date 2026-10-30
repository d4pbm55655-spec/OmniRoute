import fs from "node:fs";
import path from "node:path";
import { renderDeck } from "@/lib/render.mjs";
import { htmlToPdf } from "@/lib/pdf.mjs";
import { chargerSource, erreur, pdfResponse } from "@/lib/routes";

export const runtime = "nodejs";

// POST { chemin: "decks/xxx.md" } | { markdown, client, format?: "A4" } → PDF deck
export async function POST(req: Request) {
  try {
    const { abs, data, content, body, theme } = await chargerSource(req);
    const deck = renderDeck(content, { data, theme, format: body.format });
    const pdf = await htmlToPdf(deck.html, { width: deck.width, height: deck.height });
    if (abs) fs.writeFileSync(abs.replace(/\.md$/, ".pdf"), pdf);
    const res = pdfResponse(pdf, path.basename(abs ?? "deck.md").replace(/\.md$/, ".pdf"));
    res.headers.set("X-Slides", String(deck.slides));
    res.headers.set("X-Schema-Ratio", deck.schemaRatio.toFixed(2));
    return res;
  } catch (e) {
    return erreur(e instanceof Error ? e.message : String(e));
  }
}
