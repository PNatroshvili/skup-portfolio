// One-off tool: captures desktop/tablet/mobile screenshots of each portfolio
// project's live site and saves them into public/projects/<slug>/.
//
// Playwright isn't a project dependency (kept out of CI on purpose) — install
// it locally before running this:
//   npm install -D playwright && npx playwright install chromium
// Run with: node scripts/capture-screenshots.mjs
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(__dirname, "..", "public", "projects");

const sites = [
  { slug: "greenart", url: "https://www.greenart.ge/" },
  { slug: "rufus", url: "https://rufusthechurchill.org/" },
  { slug: "abm", url: "https://abm.org.ge/" },
  { slug: "pmfinfo", url: "https://pmfinfo.com/" },
  { slug: "around-caucasus", url: "https://around-caucasus.com/" },
  { slug: "asomtavari", url: "https://asomtavari.com/" },
  { slug: "blades", url: "https://blades.ge/" },
];

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: devices["iPhone 13"].viewport,
};

const run = async () => {
  const browser = await chromium.launch();

  for (const site of sites) {
    const dir = path.join(outRoot, site.slug);
    await mkdir(dir, { recursive: true });

    for (const [name, viewport] of Object.entries(viewports)) {
      const context = await browser.newContext({
        viewport,
        userAgent:
          name === "mobile"
            ? devices["iPhone 13"].userAgent
            : undefined,
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      try {
        await page.goto(site.url, { waitUntil: "networkidle", timeout: 30000 });
        // Dismiss common cookie banners so they don't dominate the shot.
        await page.waitForTimeout(1200);
        const file = path.join(dir, `${name}.png`);
        await page.screenshot({ path: file });
        console.log(`✓ ${site.slug} / ${name} -> ${file}`);
      } catch (err) {
        console.error(`✗ ${site.slug} / ${name}: ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
};

run();
