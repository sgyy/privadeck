import type { ToolNavItem } from "@/lib/i18n/toolNavData";

export function getToolsByCategory(toolNavData: ToolNavItem[]): Map<string, ToolNavItem[]> {
  const map = new Map<string, ToolNavItem[]>();
  for (const item of toolNavData) {
    const arr = map.get(item.category) || [];
    arr.push(item);
    map.set(item.category, arr);
  }
  return map;
}
