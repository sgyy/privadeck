export interface ToolNavItem {
  slug: string;
  category: string;
  icon: string;
  featured: boolean;
  name: string;
  description: string;
}

/**
 * Server-only: build pre-translated tool nav data for client components.
 * Call in layout.tsx so toolNames JSON is not serialized into the RSC payload.
 */
export async function buildToolNavData(
  locale: string,
): Promise<ToolNavItem[]> {
  const { getTranslations } = await import("next-intl/server");
  const tt = await getTranslations({ locale, namespace: "toolNames" });
  const { getAllTools } = await import("@/lib/registry");

  return getAllTools().map((tool) => ({
    slug: tool.slug,
    category: tool.category,
    icon: tool.icon,
    featured: tool.featured ?? false,
    name: tt(`${tool.category}.${tool.slug}.name`),
    description: tt(`${tool.category}.${tool.slug}.description`),
  }));
}