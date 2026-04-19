"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Menu, Search, Shield, ChevronDown, Share2, ImageDown, FileOutput, Scaling, Crop, Scissors, FileDown, Film, FileAudio, AudioLines, FilePlus2, FileImage, Braces, Binary, Hash, FileVideo, Volume2, Link as LinkIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { categories } from "@/lib/registry/categories";
import type { ToolCategory } from "@/lib/registry/types";
import { cn } from "@/lib/utils/cn";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";
import { trackEvent } from "@/lib/analytics";
import { getToolsByCategory } from "@/lib/utils/tools-by-category";

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

  const toolsByCategory = useMemo(() => getToolsByCategory(toolNavData), [toolNavData]);

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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
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
          <Shield className="h-6 w-6 text-primary drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
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

        {/* Language switcher */}
        <LanguageSwitcher />

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

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
          isOpen ? "bg-muted text-foreground" : "text-muted-foreground",
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onKeyDown={handleTriggerKeyDown}
        onFocus={onOpen}
        onBlur={onClose}
      >
        {tNav(category)}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full pt-1 z-50 max-w-[calc(100vw-2rem)]"
          onMouseEnter={onCancelClose}
          onMouseLeave={onClose}
          role="menu"
        >
          <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/5 animate-fade-in-scale w-max max-w-[90vw] p-5">
            <div className="flex gap-8">
              {/* Featured tools column */}
              {featured.length > 0 && (
                <div className="shrink-0 w-80">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {tNav("featured")}
                  </h3>
                  <div className="space-y-1">
                    {featured.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${category}/${tool.slug}`}
                        role="menuitem"
                        tabIndex={-1}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <ToolIcon name={tool.icon} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {tool.name}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
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
                        role="menuitem"
                        tabIndex={-1}
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
                role="menuitem"
                tabIndex={-1}
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
    const canShare = typeof navigator.share === "function";

    if (canShare) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or share failed — ignore
        return;
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        return;
      }
    }
    trackEvent("share_click", { method: canShare ? "native_share" : "clipboard" });
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

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ImageDown, FileOutput, Scaling, Crop, Scissors, FileDown, Film,
  FileAudio, AudioLines, FilePlus2, FileImage, Braces, Binary, Hash,
  FileVideo, Volume2, Link: LinkIcon,
};

function ToolIcon({ name }: { name: string }) {
  const Icon = TOOL_ICONS[name];
  if (Icon) return <Icon className="h-4 w-4" />;
  return <span className="text-sm font-bold text-accent-foreground">•</span>;
}
