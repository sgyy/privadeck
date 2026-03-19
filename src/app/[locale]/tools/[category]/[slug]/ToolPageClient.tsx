"use client";

import { Suspense, lazy, useMemo } from "react";
import { getToolBySlug } from "@/lib/registry";
import type { ToolCategory } from "@/lib/registry/types";
import { ToolBreadcrumb } from "@/components/tool/ToolBreadcrumb";
import { ToolPageShell } from "@/components/tool/ToolPageShell";
import { RelatedTools } from "@/components/tool/RelatedTools";
import { ToolFAQ } from "@/components/tool/ToolFAQ";

interface ToolPageClientProps {
  category: ToolCategory;
  slug: string;
}

function ToolSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-full rounded-lg bg-muted" />
      <div className="h-32 w-full rounded-lg bg-muted" />
      <div className="h-10 w-32 rounded-lg bg-muted" />
    </div>
  );
}

export function ToolPageClient({ category, slug }: ToolPageClientProps) {
  const tool = getToolBySlug(slug);

  const Component = useMemo(
    () => (tool ? lazy(tool.component) : null),
    [tool],
  );

  if (!tool || !Component) return null;

  return (
    <>
      <ToolBreadcrumb category={category} slug={slug} />
      <ToolPageShell tool={tool}>
        <Suspense fallback={<ToolSkeleton />}>
          <Component />
        </Suspense>
      </ToolPageShell>
      <RelatedTools slugs={tool.relatedSlugs} currentSlug={slug} />
      <ToolFAQ tool={tool} />
    </>
  );
}
