// Moteur de rendu partagé (dashboard + CLI) : markdown → HTML prêt pour Puppeteer.
// - renderDeck     : deck du Présentateur → slides 1920×1080 (ou A4 paysage)
// - renderDocument : rapport / brief → document A4
// - renderCarousel : texte → slides carrousel 1080×1350
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

const DEFAULT_THEME = { dark: "#0F172A", accent: "#F97316", light: "#F8FAFC" };

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Lit la palette imposée dans clients/{client}/brand.md (3 premiers codes hex). */
export function themeFromBrand(projectRoot, client) {
  try {
    const brand = fs.readFileSync(path.join(projectRoot, "clients", String(client), "brand.md"), "utf8");
    const line = brand.split("\n").find((l) => /palette/i.test(l)) ?? "";
    const hex = line.match(/#[0-9a-f]{6}\b/gi) ?? [];
    return {
      dark: hex[0] ?? DEFAULT_THEME.dark,
      accent: hex[1] ?? DEFAULT_THEME.accent,
      light: hex[2] ?? DEFAULT_THEME.light,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

/** Bloc ```schema``` : "A -> B -> C" devient un flow de boîtes ; le reste est rendu en markdown. */
function renderSchema(src) {
  const lines = src.trim().split("\n").filter(Boolean);
  if (lines.length && lines.every((l) => l.includes("->"))) {
    return lines
      .map((l) => {
        const steps = l.split("->").map((s) => s.trim()).filter(Boolean);
        return `<div class="flow">${steps
          .map((s, i) => `${i ? '<span class="arrow">→</span>' : ""}<div class="box">${esc(s)}</div>`)
          .join("")}</div>`;
      })
      .join("");
  }
  return `<div class="schema-md">${marked.parse(src)}</div>`;
}

function preprocess(md) {
  return md.replace(/```schema\s*\n([\s\S]*?)```/g, (_, s) => `\n<div class="schema">${renderSchema(s)}</div>\n`);
}

/** Découpe sur les lignes "---" hors blocs de code. */
export function splitSlides(body) {
  const slides = [];
  let cur = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    if (!inFence && /^---\s*$/.test(line)) {
      slides.push(cur.join("\n"));
      cur = [];
    } else cur.push(line);
  }
  slides.push(cur.join("\n"));
  return slides.map((s) => s.trim()).filter(Boolean);
}

const baseCss = (t) => `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, "Helvetica Neue", Arial, sans-serif; color: ${t.dark}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border-bottom: 1px solid #0002; padding: .45em .6em; text-align: left; vertical-align: top; }
  th { font-size: .75em; letter-spacing: .08em; text-transform: uppercase; color: ${t.accent}; }
  code { font-family: "JetBrains Mono", Menlo, monospace; font-size: .9em; }
  .flow { display: flex; align-items: center; gap: .6em; flex-wrap: wrap; margin: .4em 0; }
  .box { border: 2px solid ${t.accent}; border-radius: 14px; padding: .55em 1em; font-weight: 600; background: #fff; }
  .arrow { color: ${t.accent}; font-size: 1.4em; font-weight: 700; }
`;

/**
 * @param {string} body markdown sans frontmatter
 * @param {{ data?: Record<string, any>, theme?: typeof DEFAULT_THEME, format?: string }} opts
 */
export function renderDeck(body, opts = {}) {
  const t = opts.theme ?? DEFAULT_THEME;
  const data = opts.data ?? {};
  const a4 = String(opts.format ?? data.format_pdf ?? "1920x1080").toUpperCase() === "A4";
  const [W, H] = a4 ? ["297mm", "210mm"] : ["1920px", "1080px"];
  const slides = splitSlides(body);
  const total = slides.length;
  const footer = [data.client, data.campagne].filter(Boolean).map(esc).join(" · ");

  const html = slides
    .map((s, i) => {
      const cover = i === 0;
      const hasSchema = s.includes("```schema") || /\n\|.*\|\n/.test(s);
      return `<section class="slide ${cover ? "cover" : ""} ${hasSchema ? "with-schema" : ""}">
        <div class="inner">${marked.parse(preprocess(s))}</div>
        ${cover ? "" : `<footer><span>${footer}</span><span>${i + 1} / ${total}</span></footer>`}
      </section>`;
    })
    .join("\n");

  const schemaCount = slides.filter((s) => s.includes("```schema") || /\n\|.*\|\n/.test(s)).length;

  return {
    slides: total,
    schemaRatio: total ? schemaCount / total : 0,
    width: W,
    height: H,
    html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
      ${baseCss(t)}
      @page { size: ${W} ${H}; margin: 0; }
      .slide { width: ${W}; height: ${H}; position: relative; overflow: hidden; page-break-after: always;
        background: ${t.light}; padding: ${a4 ? "16mm 18mm" : "110px 140px"}; font-size: ${a4 ? "13pt" : "36px"}; }
      .slide .inner { height: 100%; display: flex; flex-direction: column; justify-content: center; gap: .7em; }
      .slide h1 { font-size: 2.6em; line-height: 1.05; letter-spacing: -.02em; }
      .slide h2 { font-size: 1.7em; line-height: 1.15; letter-spacing: -.01em; }
      .slide h2::before { content: ""; display: block; width: 2.2em; height: .18em; background: ${t.accent}; margin-bottom: .6em; border-radius: 4px; }
      .slide p, .slide li { line-height: 1.45; max-width: 58em; }
      .slide ul, .slide ol { padding-left: 1.2em; display: grid; gap: .35em; }
      .slide .schema { margin-top: .4em; }
      .slide footer { position: absolute; left: ${a4 ? "18mm" : "140px"}; right: ${a4 ? "18mm" : "140px"}; bottom: ${a4 ? "8mm" : "48px"};
        display: flex; justify-content: space-between; font-size: .55em; opacity: .55; letter-spacing: .06em; text-transform: uppercase; }
      .cover { background: ${t.dark}; color: ${t.light}; }
      .cover h1 { font-size: 3.4em; }
      .cover h2 { font-weight: 400; opacity: .85; }
      .cover h2::before { display: none; }
      .cover h1::after { content: ""; display: block; width: 3em; height: .12em; background: ${t.accent}; margin-top: .45em; border-radius: 4px; }
    </style></head><body>${html}</body></html>`,
  };
}

/** Document A4 (rapport analytics, brief…). */
export function renderDocument(body, opts = {}) {
  const t = opts.theme ?? DEFAULT_THEME;
  const data = opts.data ?? {};
  const meta = ["client", "campagne", "agent", "date", "version", "statut"]
    .filter((k) => data[k] !== undefined)
    .map((k) => `<span><b>${k}</b> ${esc(data[k] instanceof Date ? data[k].toISOString().slice(0, 10) : data[k])}</span>`)
    .join("");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
    ${baseCss(t)}
    @page { size: A4; margin: 18mm 16mm; }
    body { font-size: 10.5pt; line-height: 1.55; }
    .meta { display: flex; flex-wrap: wrap; gap: .4em 1.2em; font-size: 8pt; padding: .6em .8em; background: ${t.dark}; color: ${t.light}; border-radius: 6px; margin-bottom: 1.4em; }
    .meta b { color: ${t.accent}; text-transform: uppercase; letter-spacing: .06em; margin-right: .3em; }
    h1 { font-size: 22pt; line-height: 1.15; margin-bottom: .5em; }
    h2 { font-size: 13pt; margin: 1.4em 0 .5em; padding-top: .4em; border-top: 2px solid ${t.accent}; }
    h3 { font-size: 11pt; margin: 1em 0 .3em; }
    p, ul, ol, table, blockquote { margin-bottom: .7em; }
    ul, ol { padding-left: 1.3em; }
    blockquote { border-left: 3px solid ${t.accent}; padding: .2em .8em; background: #0000000a; }
    table { font-size: 9pt; page-break-inside: avoid; }
  </style></head><body><div class="meta">${meta}</div>${marked.parse(preprocess(body))}</body></html>`;
}

/** Carrousel : un tableau de textes markdown → une page HTML par slide (1080×1350). */
export function renderCarousel(slides, opts = {}) {
  const t = opts.theme ?? DEFAULT_THEME;
  const handle = opts.handle ? esc(opts.handle) : "";
  return slides.map(
    (s, i) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
      ${baseCss(t)}
      html, body { width: 1080px; height: 1350px; }
      body { background: ${i === 0 || i === slides.length - 1 ? t.dark : t.light};
        color: ${i === 0 || i === slides.length - 1 ? t.light : t.dark};
        padding: 120px 100px; display: flex; flex-direction: column; justify-content: center; font-size: 46px; position: relative; }
      h1 { font-size: 2.1em; line-height: 1.05; letter-spacing: -.02em; }
      h2 { font-size: 1.5em; line-height: 1.1; margin-bottom: .5em; }
      p, li { line-height: 1.35; }
      ul { padding-left: 1em; display: grid; gap: .3em; }
      strong { color: ${t.accent}; }
      .num { position: absolute; top: 70px; left: 100px; font-size: .55em; font-weight: 700; color: ${t.accent}; letter-spacing: .1em; }
      .handle { position: absolute; bottom: 70px; left: 100px; font-size: .5em; opacity: .6; }
      .next { position: absolute; bottom: 64px; right: 100px; font-size: .9em; color: ${t.accent}; }
    </style></head><body>
      <div class="num">${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</div>
      ${marked.parse(s)}
      <div class="handle">${handle}</div>
      ${i < slides.length - 1 ? '<div class="next">→</div>' : ""}
    </body></html>`,
  );
}
