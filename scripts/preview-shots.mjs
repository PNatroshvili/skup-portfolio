// Dev-only: screenshots the local site at several widths so the design can be
// reviewed without a browser pane. Requires `npm run dev` on :3000 plus a local
// Playwright install (see capture-screenshots.mjs).
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".preview");

const shots = [
  { name: "desktop-full", width: 1440, height: 1000, fullPage: true },
  { name: "desktop-hero", width: 1440, height: 900, fullPage: false },
  { name: "mobile-full", width: 390, height: 844, fullPage: true },
];

const run = async () => {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
    });
    const page = await context.newPage();
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 40000 });
    // Let the loading overlay clear and scroll so every reveal fires.
    await page.waitForTimeout(2500);
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);

    const file = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: shot.fullPage });
    console.log("saved", file);
    await context.close();
  }

  await browser.close();
};

run();
