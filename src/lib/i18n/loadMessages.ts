import type { ToolCategory } from "@/lib/registry/types";

/**
 * Load common messages (everything except per-tool details).
 * Includes: common, nav, categories, home, footer, privacy, howItWorks.
 * Note: toolNames is excluded — use buildToolNavData() instead.
 */
export async function loadCommonMessages(locale: string) {
  const { toolNames: _stripped, ...rest } = (
    await import(`../../../messages/${locale}/common.json`)
  ).default;
  return rest;
}

/**
 * Load tool messages for a single category.
 * Returns: { tools: { [category]: { ... } } }
 */
export async function loadCategoryMessages(
  locale: string,
  category: ToolCategory | string
) {
  return (
    await import(`../../../messages/${locale}/tools-${category}.json`)
  ).default;
}

/**
 * Load all messages (common + all tool categories merged).
 * Used for pages that need every tool's translations (e.g. /tools, homepage).
 */
export async function loadAllToolMessages(locale: string) {
  const categories = [
    "text",
    "developer",
    "image",
    "pdf",
    "video",
    "audio",
  ] as const;

  const results = await Promise.all(
    categories.map((cat) =>
      import(`../../../messages/${locale}/tools-${cat}.json`).then(
        (m) => m.default
      )
    )
  );

  // Merge all { tools: { category: ... } } into one object
  const merged: Record<string, any> = {};
  for (const r of results) {
    Object.assign(merged, r.tools);
  }
  return { tools: merged };
}
