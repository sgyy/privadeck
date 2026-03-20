"use client";

import { Suspense, lazy, useMemo, type ComponentType, type LazyExoticComponent } from "react";
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

// Stable cache: once a lazy component is created for a slug, it persists
const lazyCache = new Map<string, LazyExoticComponent<ComponentType>>();

export function ToolPageClient({ category, slug }: ToolPageClientProps) {
  const tool = getToolBySlug(slug, category);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- slug is stable per page route
  const Component = useMemo(() => {
    if (!tool) return null;
    const cacheKey = `${category}/${slug}`;
    let cached = lazyCache.get(cacheKey);
    if (!cached) {
      cached = lazy(tool.component);
      lazyCache.set(cacheKey, cached);
    }
    return cached;
  }, [slug, tool]);

  if (!tool || !Component) return null;

  return (
    <>
      <ToolBreadcrumb category={category} slug={slug} />
      <ToolPageShell tool={tool}>
        <Suspense fallback={<ToolSkeleton />}>
          <Component />
        </Suspense>
      </ToolPageShell>
      <RelatedTools slugs={tool.relatedSlugs} currentSlug={slug} category={category} />
      <ToolFAQ tool={tool} />
    </>
  );
}
