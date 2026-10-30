import fs from "node:fs";
import path from "node:path";
import { renderDocument } from "@/lib/render.mjs";
import { htmlToPdf } from "@/lib/pdf.mjs";
import { chargerSource, erreur, pdfResponse } from "@/lib/routes";

export const runtime = "nodejs";

// POST { chemin: "analytics/xxx.md" } | { markdown } → rapport PDF A4
export async function POST(req: Request) {
  try {
    const { abs, data, content, theme } = await chargerSource(req);
    const pdf = await htmlToPdf(renderDocument(content, { data, theme }), { a4: true });
    if (abs) fs.writeFileSync(abs.replace(/\.md$/, ".pdf"), pdf);
    return pdfResponse(pdf, path.basename(abs ?? "rapport.md").replace(/\.md$/, ".pdf"));
  } catch (e) {
    return erreur(e instanceof Error ? e.message : String(e));
  }
}
