// Dev-only: close-up screenshots of individual sections for design review.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".preview");

const targets = process.argv.slice(2);
const selectors = targets.length ? targets : ["#services", "#contact"];

const run = async () => {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
  });
  await page.waitForTimeout(800);

  for (const sel of selectors) {
    const el = await page.$(sel);
    if (!el) {
      console.error("not found:", sel);
      continue;
    }
    const file = path.join(outDir, `section${sel.replace(/[^a-z0-9]/gi, "-")}.png`);
    await el.screenshot({ path: file });
    console.log("saved", file);
  }

  await browser.close();
};

run();
