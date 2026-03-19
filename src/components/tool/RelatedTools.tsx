"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getToolBySlug } from "@/lib/registry";
import { Card } from "@/components/ui/Card";

interface RelatedToolsProps {
  slugs?: string[];
  currentSlug: string;
}

export function RelatedTools({ slugs, currentSlug }: RelatedToolsProps) {
  if (!slugs || slugs.length === 0) return null;

  const tools = slugs
    .filter((s) => s !== currentSlug)
    .map(getToolBySlug)
    .filter(Boolean);

  if (tools.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">Related Tools</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <RelatedToolCard key={tool!.slug} tool={tool!} />
        ))}
      </div>
    </div>
  );
}

function RelatedToolCard({
  tool,
}: {
  tool: NonNullable<ReturnType<typeof getToolBySlug>>;
}) {
  const t = useTranslations(`tools.${tool.category}.${tool.slug}`);

  return (
    <Link href={`/tools/${tool.category}/${tool.slug}`}>
      <Card className="p-4 transition-colors hover:bg-muted/50">
        <h3 className="font-medium text-sm">{t("name")}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {t("description")}
        </p>
      </Card>
    </Link>
  );
}
