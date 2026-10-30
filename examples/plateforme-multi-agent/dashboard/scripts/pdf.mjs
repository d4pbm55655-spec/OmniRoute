#!/usr/bin/env node
// Usage : npm run pdf -- ../decks/2026-10-30-demo-pitch.md [--a4]
// Deck (agent: presentateur) → slides ; tout autre livrable → document A4.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderDeck, renderDocument, themeFromBrand } from "../lib/render.mjs";
import { htmlToPdf, closeBrowser } from "../lib/pdf.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("Usage : npm run pdf -- <fichier.md> [--a4]");
  process.exit(1);
}
const abs = path.resolve(process.cwd(), file);
const projectRoot = process.env.PROJECT_ROOT ?? path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const { data, content } = matter(fs.readFileSync(abs, "utf8"));
const theme = themeFromBrand(projectRoot, data.client);
const out = abs.replace(/\.md$/, ".pdf");

let pdf;
if (data.agent === "presentateur") {
  const deck = renderDeck(content, { data, theme, format: args.includes("--a4") ? "A4" : undefined });
  pdf = await htmlToPdf(deck.html, { width: deck.width, height: deck.height });
  const pct = Math.round(deck.schemaRatio * 100);
  console.log(`${deck.slides} slides · ${pct}% avec schéma${pct < 30 ? " ⚠️ (< 30 % requis)" : ""}`);
} else {
  pdf = await htmlToPdf(renderDocument(content, { data, theme }), { a4: true });
}
fs.writeFileSync(out, pdf);
await closeBrowser();
console.log(`PDF → ${path.relative(process.cwd(), out)}`);
