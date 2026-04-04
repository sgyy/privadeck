"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getToolBySlug } from "@/lib/registry";
import type { ToolCategory } from "@/lib/registry/types";
import { Card } from "@/components/ui/Card";
import { useToolNavData } from "@/lib/i18n/ToolNavContext";
import { trackEvent } from "@/lib/analytics";

interface RelatedToolsProps {
  slugs?: string[];
  currentSlug: string;
  category: ToolCategory;
}

export function RelatedTools({ slugs, currentSlug, category }: RelatedToolsProps) {
  const t = useTranslations("common");
  const toolNavData = useToolNavData();
  if (!slugs || slugs.length === 0) return null;

  const tools = slugs
    .filter((s) => s !== currentSlug)
    .map((s) => {
      const def = getToolBySlug(s, category);
      if (!def) return null;
      const nav = toolNavData.find((item) => item.slug === s && item.category === category);
      if (!nav) return null;
      return { ...def, navName: nav.name, navDescription: nav.description };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (tools.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">{t("relatedTools")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.category}/${tool.slug}`}
            onClick={() => trackEvent("related_tool_click", { from_slug: currentSlug, to_slug: tool.slug, to_category: tool.category })}
          >
            <Card className="p-4 gradient-border">
              <h3 className="font-medium text-sm">{tool.navName}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {tool.navDescription}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
