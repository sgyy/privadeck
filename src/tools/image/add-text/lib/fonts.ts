export type FontCategory = "sans" | "serif" | "script" | "display" | "cjk" | "arabic";

export interface FontWeightDef {
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
  url: string;
}

export interface FontDef {
  key: string;
  family: string;
  category: FontCategory;
  weights: FontWeightDef[];
  /** True for Latin fonts that should be eagerly available; CJK/AR are lazy */
  preload: boolean;
}

export const FONT_REGISTRY: FontDef[] = [
  {
    key: "inter",
    family: "Inter",
    category: "sans",
    preload: true,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/inter-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/inter-700.woff2" },
    ],
  },
  {
    key: "roboto",
    family: "Roboto",
    category: "sans",
    preload: true,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/roboto-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/roboto-700.woff2" },
    ],
  },
  {
    key: "montserrat",
    family: "Montserrat",
    category: "sans",
    preload: true,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/montserrat-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/montserrat-700.woff2" },
    ],
  },
  {
    key: "bebas-neue",
    family: "Bebas Neue",
    category: "display",
    preload: true,
    weights: [{ weight: 400, style: "normal", url: "/fonts/bebas-neue-400.woff2" }],
  },
  {
    key: "playfair-display",
    family: "Playfair Display",
    category: "serif",
    preload: true,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/playfair-display-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/playfair-display-700.woff2" },
    ],
  },
  {
    key: "merriweather",
    family: "Merriweather",
    category: "serif",
    preload: true,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/merriweather-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/merriweather-700.woff2" },
    ],
  },
  {
    key: "pacifico",
    family: "Pacifico",
    category: "script",
    preload: true,
    weights: [{ weight: 400, style: "normal", url: "/fonts/pacifico-400.woff2" }],
  },
  {
    key: "lobster",
    family: "Lobster",
    category: "script",
    preload: true,
    weights: [{ weight: 400, style: "normal", url: "/fonts/lobster-400.woff2" }],
  },
  {
    key: "permanent-marker",
    family: "Permanent Marker",
    category: "display",
    preload: true,
    weights: [{ weight: 400, style: "normal", url: "/fonts/permanent-marker-400.woff2" }],
  },
  {
    key: "noto-sans-sc",
    family: "Noto Sans SC",
    category: "cjk",
    preload: false,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/noto-sans-sc-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/noto-sans-sc-700.woff2" },
    ],
  },
  {
    key: "noto-sans-jp",
    family: "Noto Sans JP",
    category: "cjk",
    preload: false,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/noto-sans-jp-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/noto-sans-jp-700.woff2" },
    ],
  },
  {
    key: "noto-sans-arabic",
    family: "Noto Sans Arabic",
    category: "arabic",
    preload: false,
    weights: [
      { weight: 400, style: "normal", url: "/fonts/noto-sans-arabic-400.woff2" },
      { weight: 700, style: "normal", url: "/fonts/noto-sans-arabic-700.woff2" },
    ],
  },
];

const loadingPromises = new Map<string, Promise<boolean>>();
const loadedKeys = new Set<string>();

function variantId(font: FontDef, weight: number, style: string): string {
  return `${font.key}::${weight}::${style}`;
}

async function loadVariant(font: FontDef, variant: FontWeightDef): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const id = variantId(font, variant.weight, variant.style);
  if (loadedKeys.has(id)) return true;
  const existing = loadingPromises.get(id);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const response = await fetch(variant.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      const face = new FontFace(font.family, buffer, {
        weight: String(variant.weight),
        style: variant.style,
        display: "swap",
      });
      await face.load();
      document.fonts.add(face);
      loadedKeys.add(id);
      return true;
    } catch {
      // Drop the cached promise so the next call retries — a transient network
      // failure shouldn't permanently block the variant for the session.
      loadingPromises.delete(id);
      return false;
    }
  })();

  loadingPromises.set(id, promise);
  return promise;
}

export async function loadFont(key: string): Promise<boolean> {
  const font = FONT_REGISTRY.find((f) => f.key === key);
  if (!font) return false;
  const results = await Promise.all(font.weights.map((v) => loadVariant(font, v)));
  return results.some(Boolean);
}

export async function preloadFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  await Promise.all(
    FONT_REGISTRY.filter((f) => f.preload).flatMap((font) =>
      font.weights.map((v) => loadVariant(font, v)),
    ),
  );
}

export function getFontByFamily(family: string): FontDef | undefined {
  return FONT_REGISTRY.find((f) => f.family === family);
}

export function getFontByKey(key: string): FontDef | undefined {
  return FONT_REGISTRY.find((f) => f.key === key);
}

export function isFontLoaded(font: FontDef, weight: number, style: string): boolean {
  return loadedKeys.has(variantId(font, weight, style));
}

// Hiragana + katakana: route to Japanese face. CJK ideographs / Hangul /
// fullwidth glyphs all default to Simplified Chinese — close enough for
// auto-suggestion (the user can still pick JP/KR manually).
const KANA_RE = /[぀-ヿ]/;
// Kana intentionally excluded — KANA_RE is checked first.
const CJK_RE = /[㐀-䶿一-鿿가-힣豈-﫿＀-￯]/;
const ARABIC_RE = /[؀-ۿݐ-ݿ]/;

export function suggestFontForText(text: string): FontDef | undefined {
  if (KANA_RE.test(text)) return getFontByKey("noto-sans-jp");
  if (CJK_RE.test(text)) return getFontByKey("noto-sans-sc");
  if (ARABIC_RE.test(text)) return getFontByKey("noto-sans-arabic");
  return undefined;
}
