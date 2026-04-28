/* eslint-disable react-hooks/static-components */
"use client";

import { Suspense, lazy, useEffect, useRef, type ComponentType, type LazyExoticComponent } from "react";
import { getToolBySlug } from "@/lib/registry";
import type { ToolCategory } from "@/lib/registry/types";
import { ToolBreadcrumb } from "@/components/tool/ToolBreadcrumb";
import { ToolPageShell } from "@/components/tool/ToolPageShell";
import { RelatedTools } from "@/components/tool/RelatedTools";
import { ToolFAQ } from "@/components/tool/ToolFAQ";
import { trackToolView } from "@/lib/analytics";

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

function getLazyComponent(cacheKey: string, factory: () => Promise<{ default: ComponentType }>): LazyExoticComponent<ComponentType> | null {
  let cached = lazyCache.get(cacheKey);
  if (!cached) {
    cached = lazy(factory);
    lazyCache.set(cacheKey, cached);
  }
  return cached;
}

export function ToolPageClient({ category, slug }: ToolPageClientProps) {
  const tool = getToolBySlug(slug, category);
  const viewSentRef = useRef<string>("");

  useEffect(() => {
    if (!tool) return;
    const key = `${category}/${slug}`;
    if (viewSentRef.current === key) return;
    viewSentRef.current = key;
    trackToolView(slug, category);
  }, [tool, slug, category]);

  if (!tool) return null;

  const cacheKey = `${category}/${slug}`;
  const Component = getLazyComponent(cacheKey, tool.component);

  if (!Component) return null;

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
