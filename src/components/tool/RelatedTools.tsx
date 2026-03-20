"use client";

import { Link } from "@/i18n/navigation";
import { getToolBySlug } from "@/lib/registry";
import type { ToolCategory } from "@/lib/registry/types";
import { Card } from "@/components/ui/Card";
import { useToolNavData } from "@/lib/i18n/ToolNavContext";

interface RelatedToolsProps {
  slugs?: string[];
  currentSlug: string;
  category: ToolCategory;
}

export function RelatedTools({ slugs, currentSlug, category }: RelatedToolsProps) {
  const toolNavData = useToolNavData();
  if (!slugs || slugs.length === 0) return null;

  const tools = slugs
    .filter((s) => s !== currentSlug)
    .map((s) => {
      const def = getToolBySlug(s, category);
      if (!def) return null;
      const nav = toolNavData.find((t) => t.slug === s && t.category === category);
      return nav ? { ...def, navName: nav.name, navDescription: nav.description } : null;
    })
    .filter(Boolean);

  if (tools.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">Related Tools</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool!.slug} href={`/tools/${tool!.category}/${tool!.slug}`}>
            <Card className="p-4 transition-colors hover:bg-muted/50">
              <h3 className="font-medium text-sm">{tool!.navName}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {tool!.navDescription}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
