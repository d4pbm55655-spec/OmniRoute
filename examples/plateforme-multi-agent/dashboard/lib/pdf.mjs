// Conversion HTML → PDF / PNG via Puppeteer (Chromium headless).
import puppeteer from "puppeteer";

let browserPromise = null;
function browser() {
  browserPromise ??= puppeteer.launch({ headless: true, args: ["--no-sandbox", "--font-render-hinting=none"] });
  return browserPromise;
}

/** @param {string} html @param {{ width?: string, height?: string, a4?: boolean }} opts */
export async function htmlToPdf(html, opts = {}) {
  const page = await (await browser()).newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf(
      opts.a4 ? { format: "A4", printBackground: true, preferCSSPageSize: true }
              : { width: opts.width, height: opts.height, printBackground: true, preferCSSPageSize: true },
    );
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/** @param {string[]} pages HTML d'une slide chacune @returns {Promise<Buffer[]>} */
export async function htmlToPngs(pages, width = 1080, height = 1350) {
  const page = await (await browser()).newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const out = [];
    for (const html of pages) {
      await page.setContent(html, { waitUntil: "networkidle0" });
      out.push(Buffer.from(await page.screenshot({ type: "png" })));
    }
    return out;
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browserPromise) (await browserPromise).close();
  browserPromise = null;
}
