#!/usr/bin/env node
// Downloads woff2 font subsets from Google Fonts to public/fonts/
// Run once during setup: `node scripts/download-fonts.mjs`

import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = resolve(__dirname, "..", "public", "fonts");

// User-Agent is critical: Google Fonts CSS API returns different formats based on it.
// This UA forces woff2 with maximum compatibility.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const LATIN_FONTS = [
  { key: "inter", family: "Inter", weights: [400, 700] },
  { key: "roboto", family: "Roboto", weights: [400, 700] },
  { key: "montserrat", family: "Montserrat", weights: [400, 700] },
  { key: "open-sans", family: "Open+Sans", weights: [400, 700] },
  { key: "raleway", family: "Raleway", weights: [400, 700] },
  { key: "oswald", family: "Oswald", weights: [400, 700] },
  { key: "anton", family: "Anton", weights: [400] },
  { key: "bebas-neue", family: "Bebas+Neue", weights: [400] },
  { key: "righteous", family: "Righteous", weights: [400] },
  { key: "playfair-display", family: "Playfair+Display", weights: [400, 700] },
  { key: "merriweather", family: "Merriweather", weights: [400, 700] },
  { key: "noto-serif", family: "Noto+Serif", weights: [400, 700] },
  { key: "pacifico", family: "Pacifico", weights: [400] },
  { key: "lobster", family: "Lobster", weights: [400] },
  { key: "permanent-marker", family: "Permanent+Marker", weights: [400] },
  { key: "dancing-script", family: "Dancing+Script", weights: [400, 700] },
  { key: "caveat", family: "Caveat", weights: [400, 700] },
];

const CJK_FONTS = [
  { key: "noto-sans-sc", family: "Noto+Sans+SC", weights: [400, 700], subset: "chinese-simplified" },
  { key: "noto-sans-jp", family: "Noto+Sans+JP", weights: [400, 700], subset: "japanese" },
  { key: "noto-sans-arabic", family: "Noto+Sans+Arabic", weights: [400, 700], subset: "arabic" },
];

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchCss(family, weight) {
  // Request a SINGLE weight at a time. When multiple weights are requested in
  // one CSS query, Google now serves a variable font and returns the SAME url
  // in every @font-face block — both static-weight FontFace registrations
  // would then point at the same buffer, defeating the bold/regular distinction.
  // Per-weight queries return the correct static slice (or the variable axis
  // pinned to that weight).
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`CSS fetch ${url}: ${res.status}`);
  return res.text();
}

/**
 * Parse all `@font-face { ... src: url(...).woff2 ...; font-weight: N; }` blocks.
 * Returns Map<weight, [url, ...]> — for CJK fonts the same weight has many subsets.
 */
function parseFontFaces(css) {
  const blocks = css.match(/@font-face\s*\{[^}]+\}/g) || [];
  const map = new Map();
  for (const block of blocks) {
    const wm = block.match(/font-weight:\s*(\d+)/);
    const um = block.match(/url\(([^)]+\.woff2)\)/g);
    if (!wm || !um) continue;
    const weight = Number(wm[1]);
    const urls = um.map((u) => u.replace(/url\(|\)/g, ""));
    if (!map.has(weight)) map.set(weight, []);
    map.get(weight).push(...urls);
  }
  return map;
}

async function downloadBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processLatin(font) {
  for (const w of font.weights) {
    const out = resolve(FONTS_DIR, `${font.key}-${w}.woff2`);
    if (await fileExists(out)) {
      console.log(`  ✓ ${font.key}-${w} (cached)`);
      continue;
    }
    const css = await fetchCss(font.family, w);
    const faces = parseFontFaces(css);
    const urls = faces.get(w);
    if (!urls || urls.length === 0) {
      console.warn(`  ! ${font.key} ${w}: no woff2 url found`);
      continue;
    }
    // Pick the latin subset (first one is usually latin); fall back to first
    const url = urls.find((u) => u.includes("latin")) || urls[0];
    const buf = await downloadBuffer(url);
    await writeFile(out, buf);
    console.log(`  ✓ ${font.key}-${w} (${(buf.length / 1024).toFixed(1)} KB)`);
  }
}

async function processCjk(font) {
  for (const w of font.weights) {
    const out = resolve(FONTS_DIR, `${font.key}-${w}.woff2`);
    if (await fileExists(out)) {
      console.log(`  ✓ ${font.key}-${w} (cached)`);
      continue;
    }
    const css = await fetchCss(font.family, w);
    const faces = parseFontFaces(css);
    const urls = faces.get(w);
    if (!urls || urls.length === 0) {
      console.warn(`  ! ${font.key} ${w}: no woff2 url found`);
      continue;
    }
    // Google serves many unicode-range subsets. Pick the largest one — usually
    // contains the most chars. Cache buffers from the sizing pass so we don't
    // pay for the winner twice.
    const sized = await Promise.all(
      urls.slice(0, 5).map(async (u) => {
        const buf = await downloadBuffer(u);
        return { u, buf, len: buf.length };
      }),
    );
    const best = sized.sort((a, b) => b.len - a.len)[0];
    await writeFile(out, best.buf);
    console.log(`  ✓ ${font.key}-${w} (${(best.buf.length / 1024).toFixed(1)} KB, largest subset)`);
  }
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });
  console.log(`Downloading fonts to ${FONTS_DIR}\n`);

  console.log("Latin fonts:");
  for (const font of LATIN_FONTS) {
    try {
      await processLatin(font);
    } catch (e) {
      console.error(`  ✗ ${font.key}: ${e.message}`);
    }
  }

  console.log("\nCJK / Arabic fonts:");
  for (const font of CJK_FONTS) {
    try {
      await processCjk(font);
    } catch (e) {
      console.error(`  ✗ ${font.key}: ${e.message}`);
    }
  }

  console.log("\nDone. These files are loaded by src/tools/image/add-text/lib/fonts.ts at runtime.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
