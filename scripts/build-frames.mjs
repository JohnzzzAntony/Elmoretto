// Converts the AI-upscaled 3840×2160 frames into the WebP sets the homepage scrubs.
// Usage: node scripts/build-frames.mjs <dir of upscaled ezgif-frame-NNN.jpg>
// Upscale first: realesrgan-ncnn-vulkan -i <frames> -o <dir> -n realesr-animevideov3 -s 3 -f jpg
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const source = process.argv[2];
const out = path.join(import.meta.dirname, "..", "public", "frames");
const sets = [[3840, 78], [1920, 82], ["portrait", 82]];
// Phones get a centred, full-height 1350 × 2160 crop of the 4K frame, matching what object-fit: cover shows.
const portrait = { left: (3840 - 1350) / 2, top: 0, width: 1350, height: 2160 };

const files = fs.readdirSync(source).filter((name) => /frame-\d+\.jpg$/.test(name)).sort();
for (const [width] of sets) fs.mkdirSync(path.join(out, String(width)), { recursive: true });
for (const name of files) {
  const index = name.match(/(\d+)\.jpg$/)[1];
  for (const [width, quality] of sets) {
    await sharp(path.join(source, name))
      .resize(3840, 2160, { kernel: "lanczos3" })
      .extract(width === "portrait" ? portrait : { left: 0, top: 0, width: 3840, height: 2160 })
      .resize(width === "portrait" ? 1350 : width, width === "portrait" ? 2160 : width * 9 / 16, { kernel: "lanczos3" })
      .webp({ quality, effort: 5 })
      .toFile(path.join(out, String(width), `${index}.webp`));
  }
}
for (const [width] of sets) {
  const written = fs.readdirSync(path.join(out, String(width)));
  const bytes = written.reduce((sum, name) => sum + fs.statSync(path.join(out, String(width), name)).size, 0);
  console.log(`${width}: ${written.length} frames, ${(bytes / 1048576).toFixed(1)} MB`);
  const missing = files.filter((name) => !written.includes(name.replace(/^.*?(\d+)\.jpg$/, "$1.webp")));
  if (missing.length) throw new Error(`${width} set is missing ${missing.length} frames, e.g. ${missing[0]}`);
}
