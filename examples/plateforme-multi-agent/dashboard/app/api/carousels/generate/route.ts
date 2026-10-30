import fs from "node:fs";
import path from "node:path";
import { renderCarousel, splitSlides } from "@/lib/render.mjs";
import { htmlToPngs } from "@/lib/pdf.mjs";
import { chargerSource, erreur } from "@/lib/routes";
import { PROJECT_ROOT } from "@/lib/livrables";

export const runtime = "nodejs";

/** Extrait la section "## Slides" (slides séparées par ---), sinon tout le contenu. */
function slidesDe(content: string): string[] {
  const m = content.match(/^##\s+Slides\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  return splitSlides(m ? m[1] : content);
}

// POST { chemin: "content/xxx-linkedin-carrousel-yyy.md" } | { markdown } → PNG 1080×1350
export async function POST(req: Request) {
  try {
    const { abs, data, content, theme } = await chargerSource(req);
    const slides = slidesDe(content);
    if (!slides.length) return erreur("Aucune slide trouvée (section « ## Slides », séparées par ---).");
    const pngs = await htmlToPngs(renderCarousel(slides, { theme, handle: data.client }));
    const slug = path.basename(abs ?? `carrousel-${Date.now()}.md`, ".md");
    const dir = path.join(PROJECT_ROOT, "content", "carrousels", slug);
    fs.mkdirSync(dir, { recursive: true });
    const fichiers = pngs.map((png, i) => {
      const f = path.join(dir, `slide-${String(i + 1).padStart(2, "0")}.png`);
      fs.writeFileSync(f, png);
      return path.relative(PROJECT_ROOT, f);
    });
    return Response.json({ dossier: path.relative(PROJECT_ROOT, dir), fichiers });
  } catch (e) {
    return erreur(e instanceof Error ? e.message : String(e));
  }
}
