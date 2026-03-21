"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import type { ToolCategory } from "@/lib/registry/types";
import { SITE_URL } from "@/lib/seo/jsonld";

interface ToolBreadcrumbProps {
  category: ToolCategory;
  slug: string;
}

export function ToolBreadcrumb({ category, slug }: ToolBreadcrumbProps) {
  const tn = useTranslations("nav");
  const tc = useTranslations("categories");
  const tt = useTranslations(`tools.${category}.${slug}`);
  const locale = useLocale();

  const toolName = tt("name");
  const categoryName = tc(`${category}.name`);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tn("home"),
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tn("tools"),
        item: `${SITE_URL}/${locale}/tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${SITE_URL}/${locale}/tools/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: toolName,
        item: `${SITE_URL}/${locale}/tools/${category}/${slug}`,
      },
    ],
  };

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {tn("home")}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">
          {tn("tools")}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/tools/${category}`} className="hover:text-foreground">
          {categoryName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{toolName}</span>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
