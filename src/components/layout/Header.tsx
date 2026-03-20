"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Menu, Search, Shield, ChevronDown, Share2 } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { categories } from "@/lib/registry/categories";
import type { ToolCategory } from "@/lib/registry/types";
import { cn } from "@/lib/utils/cn";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  toolNavData: ToolNavItem[];
}

export function Header({ onMenuClick, onSearchClick, toolNavData }: HeaderProps) {
  const t = useTranslations("common");
  const [activeMenu, setActiveMenu] = useState<ToolCategory | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pathname = usePathname();

  const toolsByCategory = useMemo(() => {
    const map = new Map<string, ToolNavItem[]>();
    for (const item of toolNavData) {
      const arr = map.get(item.category) || [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  }, [toolNavData]);

  // Close menu on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setActiveMenu(null); }, [pathname]);

  const openMenu = useCallback((cat: ToolCategory) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(cat);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl flex h-16 items-center gap-2 px-4 lg:px-6">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label={t("toggleMenu")}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-foreground shrink-0"
        >
          <Shield className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{t("siteName")}</span>
        </Link>

        {/* Desktop category nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {categories.map((cat) => (
            <CategoryDropdown
              key={cat.key}
              category={cat.key}
              tools={toolsByCategory.get(cat.key) || []}
              isOpen={activeMenu === cat.key}
              onOpen={() => openMenu(cat.key)}
              onClose={scheduleClose}
              onCancelClose={cancelClose}
            />
          ))}
        </nav>

        {/* Search */}
        <button
          type="button"
          onClick={onSearchClick}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted w-48 lg:w-72"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("search")}</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-xs font-mono sm:inline">
            {t("searchShortcut")}
          </kbd>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Share button */}
        <ShareButton />

      </div>
    </header>
  );
}

function CategoryDropdown({
  category,
  tools,
  isOpen,
  onOpen,
  onClose,
  onCancelClose,
}: {
  category: ToolCategory;
  tools: ToolNavItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCancelClose: () => void;
}) {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");

  const featured = tools.filter((item) => item.featured);
  const others = tools.filter((item) => !item.featured);

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <Link
        href={`/tools/${category}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
          isOpen ? "bg-muted text-foreground" : "text-muted-foreground",
        )}
      >
        {tNav(category)}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </Link>

      {isOpen && (
        <div
          className="absolute left-0 top-full pt-1 z-50 max-w-[calc(100vw-2rem)]"
          onMouseEnter={onCancelClose}
          onMouseLeave={onClose}
        >
          <div className="rounded-xl border border-border bg-card shadow-xl w-max max-w-[90vw] p-5">
            <div className="flex gap-8">
              {/* Featured tools column */}
              {featured.length > 0 && (
                <div className="shrink-0">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {tNav("featured")}
                  </h3>
                  <div className="space-y-1">
                    {featured.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${category}/${tool.slug}`}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <ToolIcon name={tool.icon} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">
                            {tool.name}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {tool.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Other tools column */}
              {others.length > 0 && (
                <div className="shrink-0">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {tNav("otherTools")}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {others.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${category}/${tool.slug}`}
                        className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground text-card-foreground"
                      >
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* If no featured/other split, show all in one column */}
              {featured.length === 0 && others.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  {t("noToolsYet")}
                </p>
              )}
            </div>

            {/* Footer: view all */}
            <div className="mt-4 border-t border-border pt-3">
              <Link
                href={`/tools/${category}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {tNav("allCategoryTools")} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareButton() {
  const t = useTranslations("common");

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={t("share")}
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}

function ToolIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    Type: "T",
    CaseSensitive: "Aa",
    FileText: "¶",
    Braces: "{}",
    Binary: "01",
    Link: "🔗",
    Image: "🖼",
  };

  return (
    <span className="text-sm font-bold text-accent-foreground">
      {icons[name] || "•"}
    </span>
  );
}
