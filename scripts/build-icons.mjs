// Turns the fal.ai artwork in assets-src/ into PWA / favicon / Apple icons.
// Run: node scripts/build-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const NAVY = { r: 24, g: 25, b: 65 };
const SIZE = 1024;
await mkdir("public/icons", { recursive: true });

// Render the icon and cut it to its own rounded square so the white margin
// around it becomes transparent. Bounds are measured on the middle row/column.
const { data, info } = await sharp("assets-src/app-icon.svg")
  .resize(SIZE, SIZE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const isWhite = (x, y) => { const i = (y * SIZE + x) * 4; return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200; };
let left = 0; while (isWhite(left, SIZE / 2)) left++;
let top = 0; while (isWhite(SIZE / 2, top)) top++;
const side = SIZE - 2 * Math.max(left, top);
const inset = Math.max(left, top);
const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect x="${inset}" y="${inset}" width="${side}" height="${side}" rx="${side * 0.2}" fill="#000"/></svg>`;
const roundedBuf = await sharp(data, { raw: info })
  .composite([{ input: Buffer.from(mask), blend: "dest-in" }]).png().toBuffer();

// Full-bleed opaque variant (for maskable + Apple): art at 78% on navy.
const inner = Math.round(SIZE * 0.78);
const art = await sharp(roundedBuf).resize(inner, inner).toBuffer();
const fullBleed = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { ...NAVY, alpha: 1 } } })
  .composite([{ input: art, gravity: "centre" }]).png().toBuffer();

const out = (buf, size, file) => sharp(buf).resize(size, size).png().toFile(file);
await out(roundedBuf, 192, "public/icons/icon-192.png");
await out(roundedBuf, 512, "public/icons/icon-512.png");
await out(fullBleed, 512, "public/icons/icon-maskable-512.png");
await out(fullBleed, 192, "public/icons/icon-maskable-192.png");
await out(fullBleed, 180, "src/app/apple-icon.png");
await out(roundedBuf, 64, "src/app/icon.png");

// "New idea" shortcut icon: orange plus on navy.
const plus = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="rgb(24,25,65)"/><path d="M48 26v44M26 48h44" stroke="#FF5A1F" stroke-width="9" stroke-linecap="round"/></svg>`;
await sharp(Buffer.from(plus)).png().toFile("public/icons/shortcut-new.png");

// Empty-state illustration: convert darkness to alpha so it can be used as a
// CSS mask and recoloured per theme.
const ill = await sharp("assets-src/empty-state.svg").resize(640, 640).flatten({ background: "#fff" })
  .greyscale().negate().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(640 * 640 * 4);
for (let i = 0; i < 640 * 640; i++) rgba[i * 4 + 3] = ill.data[i];
await sharp(rgba, { raw: { width: 640, height: 640, channels: 4 } }).png().toFile("public/empty-state.png");
console.log("icons built");
