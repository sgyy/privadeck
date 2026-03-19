"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import type { ToolCategory } from "@/lib/registry/types";

interface ToolBreadcrumbProps {
  category: ToolCategory;
  slug: string;
}

export function ToolBreadcrumb({ category, slug }: ToolBreadcrumbProps) {
  const tn = useTranslations("nav");
  const tc = useTranslations("categories");
  const tt = useTranslations(`tools.${category}.${slug}`);

  return (
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
        {tc(`${category}.name`)}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{tt("name")}</span>
    </nav>
  );
}
