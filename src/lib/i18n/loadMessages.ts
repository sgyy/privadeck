import type { ToolCategory } from "@/lib/registry/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

/**
 * Deep merge two objects. Values in `override` take precedence.
 * Used to layer locale-specific messages on top of English fallback.
 */
function deepMerge(base: AnyObj, override: AnyObj): AnyObj {
  const result: AnyObj = { ...base };
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === "object" &&
      !Array.isArray(override[key]) &&
      typeof result[key] === "object" &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

/** Cache English messages so we only import once per build. */
let enCommonCache: AnyObj | null = null;
const enToolCategoryCache: Record<string, AnyObj> = {};

async function getEnCommon(): Promise<AnyObj> {
  if (!enCommonCache) {
    const { toolNames: _, ...rest } = (
      await import(`../../../messages/en/common.json`)
    ).default;
    enCommonCache = rest;
  }
  return enCommonCache;
}

async function getEnToolCategory(category: string): Promise<AnyObj> {
  if (!enToolCategoryCache[category]) {
    enToolCategoryCache[category] = (
      await import(`../../../messages/en/tools-${category}.json`)
    ).default;
  }
  return enToolCategoryCache[category];
}

/**
 * Load common messages (everything except per-tool details).
 * Includes: common, nav, categories, home, footer, privacy, howItWorks.
 * Note: toolNames is excluded — use buildToolNavData() instead.
 * Falls back to English for any missing keys.
 */
export async function loadCommonMessages(locale: string) {
  const { toolNames: _, ...rest } = (
    await import(`../../../messages/${locale}/common.json`)
  ).default;
  if (locale === "en") return rest;
  const enFallback = await getEnCommon();
  return deepMerge(enFallback, rest);
}

/**
 * Load tool messages for a single category.
 * Returns: { tools: { [category]: { ... } } }
 * Falls back to English for any missing keys.
 */
export async function loadCategoryMessages(
  locale: string,
  category: ToolCategory | string
) {
  const localeMessages = (
    await import(`../../../messages/${locale}/tools-${category}.json`)
  ).default;
  if (locale === "en") return localeMessages;
  const enFallback = await getEnToolCategory(category as string);
  return deepMerge(enFallback, localeMessages);
}

/**
 * Load all messages (common + all tool categories merged).
 * Used for pages that need every tool's translations (e.g. /tools, homepage).
 * Falls back to English for any missing keys.
 */
export async function loadAllToolMessages(locale: string) {
  const categories = [
    "developer",
    "image",
    "pdf",
    "video",
    "audio",
  ] as const;

  const results = await Promise.all(
    categories.map(async (cat) => {
      const localeData = (
        await import(`../../../messages/${locale}/tools-${cat}.json`)
      ).default;
      if (locale === "en") return localeData;
      const enData = await getEnToolCategory(cat);
      return deepMerge(enData, localeData);
    })
  );

  // Merge all { tools: { category: ... } } into one object
  const merged: Record<string, Record<string, unknown>> = {};
  for (const r of results) {
    Object.assign(merged, r.tools);
  }
  return { tools: merged };
}
