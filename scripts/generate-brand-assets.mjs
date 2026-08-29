// Generates the favicon/app icons and the Open Graph share image from a
// single SVG source, so the mark used in <Logo> also becomes the site's icon
// and social preview. Requires sharp locally: npm install -D sharp
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, "..", "src", "app");
const publicDir = path.join(__dirname, "..", "public");

const BG = "#0b0b0c";
const FG = "#eceae6";
const ACCENT = "#cbb894";

// Same mark as src/components/Logo.tsx (terminal prompt, refined: no border
// stroke, thinner lines). A solid rounded-square backing is kept here only
// because a favicon has to hold up against arbitrary browser-chrome themes;
// <Logo> itself renders the mark unframed on the site's own dark background.
const markSvg = (size, radius) => `
<svg width="${size}" height="${size}" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="${radius}" fill="${BG}"/>
  <path d="M13 13 19 18 13 23" stroke="${FG}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M22 23h5" stroke="${ACCENT}" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <g opacity="0.5">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 96}" y1="0" x2="${i * 96}" y2="630" stroke="#ffffff" stroke-opacity="0.05"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 96}" x2="1200" y2="${i * 96}" stroke="#ffffff" stroke-opacity="0.05"/>`).join("")}
  </g>
  <g transform="translate(100,120)">
    <path d="M30 30 45 42 30 54" stroke="${FG}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M51 54h12" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="100" y="290" font-family="Arial, sans-serif" font-size="26" letter-spacing="6" fill="${ACCENT}">SKUP STUDIO</text>
  <text x="100" y="360" font-family="Arial, sans-serif" font-size="58" font-weight="600" fill="${FG}">ვებ, დესკტოპ და მობაილ</text>
  <text x="100" y="428" font-family="Arial, sans-serif" font-size="58" font-weight="600" fill="${FG}">დეველოპმენტი</text>
  <text x="100" y="500" font-family="Arial, sans-serif" font-size="26" fill="#97948e">skup.ge</text>
</svg>`;

const run = async () => {
  await mkdir(publicDir, { recursive: true });

  // radius is in the 0-36 viewBox's own units, not output pixels — it does
  // not scale with `size`. A previous version passed 148 / 52 here, which
  // clamps well past half the viewBox and rasterized as a full circle
  // instead of a rounded square.
  await sharp(Buffer.from(markSvg(512, 10)))
    .resize(512, 512)
    .png()
    .toFile(path.join(appDir, "icon.png"));

  await sharp(Buffer.from(markSvg(180, 10)))
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));

  const ogBuf = await sharp(Buffer.from(ogSvg)).png().toBuffer();
  await writeFile(path.join(publicDir, "og-image.png"), ogBuf);

  console.log("✓ src/app/icon.png (512x512)");
  console.log("✓ src/app/apple-icon.png (180x180)");
  console.log("✓ public/og-image.png (1200x630)");
};

run();
