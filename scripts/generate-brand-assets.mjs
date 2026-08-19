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

// Same mark as src/components/Logo.tsx (terminal prompt in a rounded square).
const markSvg = (size, radius) => `
<svg width="${size}" height="${size}" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="${radius}" fill="${BG}"/>
  <rect x="0.9" y="0.9" width="34.2" height="34.2" rx="${radius - 0.6}" stroke="${FG}" stroke-opacity="0.25" stroke-width="1.2"/>
  <path d="M12 13.5 16.8 18 12 22.5" stroke="${FG}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M19.6 22.6h5.2" stroke="${ACCENT}" stroke-width="2.3" stroke-linecap="round"/>
</svg>`;

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <g opacity="0.5">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 96}" y1="0" x2="${i * 96}" y2="630" stroke="#ffffff" stroke-opacity="0.05"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 96}" x2="1200" y2="${i * 96}" stroke="#ffffff" stroke-opacity="0.05"/>`).join("")}
  </g>
  <g transform="translate(100,120)">
    <rect width="84" height="84" rx="24" fill="${BG}"/>
    <rect x="2" y="2" width="80" height="80" rx="22" stroke="${FG}" stroke-opacity="0.28" stroke-width="2.6"/>
    <path d="M28 31.5 39 42 28 52.5" stroke="${FG}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M46 52.6h12.5" stroke="${ACCENT}" stroke-width="5.2" stroke-linecap="round"/>
  </g>
  <text x="100" y="290" font-family="Arial, sans-serif" font-size="26" letter-spacing="6" fill="${ACCENT}">SKUP STUDIO</text>
  <text x="100" y="360" font-family="Arial, sans-serif" font-size="58" font-weight="600" fill="${FG}">ვებ, დესკტოპ და მობაილ</text>
  <text x="100" y="428" font-family="Arial, sans-serif" font-size="58" font-weight="600" fill="${FG}">დეველოპმენტი</text>
  <text x="100" y="500" font-family="Arial, sans-serif" font-size="26" fill="#97948e">skup.ge</text>
</svg>`;

const run = async () => {
  await mkdir(publicDir, { recursive: true });

  await sharp(Buffer.from(markSvg(512, 148)))
    .resize(512, 512)
    .png()
    .toFile(path.join(appDir, "icon.png"));

  await sharp(Buffer.from(markSvg(180, 52)))
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
