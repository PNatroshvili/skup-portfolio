// Converts every project screenshot from PNG to WebP (q=82) in place and
// removes the source PNG. Run once after capture-screenshots.mjs, or re-run
// after adding new project images manually.
import sharp from "sharp";
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "public", "projects");

const run = async () => {
  const dirs = await readdir(root, { withFileTypes: true });
  let before = 0;
  let after = 0;

  for (const dir of dirs.filter((d) => d.isDirectory())) {
    const files = await readdir(path.join(root, dir.name));
    for (const file of files.filter((f) => f.endsWith(".png"))) {
      const src = path.join(root, dir.name, file);
      const dest = src.replace(/\.png$/, ".webp");
      const buf = await sharp(src).webp({ quality: 82 }).toBuffer();
      const { size: srcSize } = await import("node:fs").then((fs) =>
        fs.promises.stat(src)
      );
      before += srcSize;
      after += buf.length;
      await import("node:fs").then((fs) => fs.promises.writeFile(dest, buf));
      await unlink(src);
      console.log(`${dir.name}/${file} -> ${path.basename(dest)} (${srcSize}B -> ${buf.length}B)`);
    }
  }

  console.log(`\nTotal: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${(100 - (after / before) * 100).toFixed(0)}% smaller)`);
};

run();
