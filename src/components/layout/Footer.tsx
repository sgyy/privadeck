"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { categories } from "@/lib/registry/categories";
import type { ToolCategory } from "@/lib/registry/types";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";

const MAX_TOOLS = 3;

interface FooterProps {
  toolNavData: ToolNavItem[];
}

function CategoryLinks({ category, tools }: { category: ToolCategory; tools: ToolNavItem[] }) {
  const tcat = useTranslations("categories");
  const displayTools = tools.slice(0, MAX_TOOLS);

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-1.5">
        <Link href={`/tools/${category}`} className="hover:text-primary transition-colors">
          {tcat(`${category}.name`)}
        </Link>
      </h4>
      <ul className="space-y-0.5">
        {displayTools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${category}/${tool.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ toolNavData }: FooterProps) {
  const t = useTranslations("common");
  const tf = useTranslations("footer");

  const toolsByCategory = useMemo(() => {
    const map = new Map<string, ToolNavItem[]>();
    for (const item of toolNavData) {
      const arr = map.get(item.category) || [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  }, [toolNavData]);

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Top row: brand + 6 categories in a compact grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Brand */}
          <div className="lg:w-56 shrink-0">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              {t("siteName")}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {tf("tagline")}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>{t("privacy")}</span>
            </div>
          </div>

          {/* 6 categories in a 3x2 grid (desktop) / 2x3 (tablet) / stacked (mobile) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 flex-1">
            {categories.map((cat) => (
              <CategoryLinks key={cat.key} category={cat.key} tools={toolsByCategory.get(cat.key) || []} />
            ))}
          </div>

          {/* About links */}
          <div className="lg:w-28 shrink-0">
            <h4 className="text-sm font-semibold text-foreground mb-1.5">
              {tf("about")}
            </h4>
            <ul className="space-y-0.5">
              <li>
                <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {tf("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {tf("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {t("siteName")}. {tf("allRightsReserved")}
          </p>
          <div className="flex items-center gap-1">
            <LanguageSwitcher dropdownDirection="up" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
