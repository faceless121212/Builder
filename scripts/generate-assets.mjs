// Generates brand artwork with fal.ai. Run: node --env-file=.env.local scripts/generate-assets.mjs
// Outputs raw images into assets-src/; scripts/build-icons.sh resizes them for the PWA.
import { writeFile } from "node:fs/promises";

const KEY = process.env.FAL_KEY;
if (!KEY) throw new Error("FAL_KEY missing in .env.local");

const jobs = [
  {
    out: "assets-src/app-icon.svg",
    model: "fal-ai/recraft/v3/text-to-image",
    input: {
      prompt:
        "App icon, flat vector. Deep ink-blue (#14213D) rounded square filled edge to edge. Centered: a bold white technical-drawing figure label reading 'FIG.09' is NOT used; instead a minimal white compass/drafting-divider shape forming the letter F over a faint blueprint grid, one small signal-orange (#FF5A1F) dot at the top-right. Crisp geometric lines, no text, no gradients, no shadows.",
      image_size: "square_hd",
      style: "vector_illustration",
    },
  },
  {
    out: "assets-src/empty-state.svg",
    model: "fal-ai/recraft/v3/text-to-image",
    input: {
      prompt:
        "Minimal technical blueprint line drawing of a light bulb being measured with dimension lines and a drafting compass, thin ink-blue (#14213D) strokes on a plain pure white background, one tiny signal-orange (#FF5A1F) accent, lots of empty space, engineering-sketch style, no text",
      image_size: "square_hd",
      style: "vector_illustration",
    },
  },
];

for (const job of jobs) {
  const res = await fetch(`https://fal.run/${job.model}`, {
    method: "POST",
    headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(job.input),
  });
  if (!res.ok) throw new Error(`${job.model}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const url = data.images?.[0]?.url;
  const img = await fetch(url);
  await writeFile(job.out, Buffer.from(await img.arrayBuffer()));
  console.log("wrote", job.out, img.headers.get("content-type"));
}
