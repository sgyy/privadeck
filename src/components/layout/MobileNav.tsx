"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { categories } from "@/lib/registry/categories";
import { cn } from "@/lib/utils/cn";
import { Home, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useEffect, useState, useMemo, useRef } from "react";
import type { ToolCategory } from "@/lib/registry/types";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";
import { Dialog, DialogOverlay, DialogContent, DialogTitle, DialogClose } from "@/components/ui/Dialog";
import { getToolsByCategory } from "@/lib/utils/tools-by-category";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  toolNavData: ToolNavItem[];
}

export function MobileNav({ open, onClose, toolNavData }: MobileNavProps) {
  const tc = useTranslations("common");
  const tcat = useTranslations("categories");
  const tn = useTranslations("nav");
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<ToolCategory | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toolsByCategory = useMemo(() => getToolsByCategory(toolNavData), [toolNavData]);

  // Close on route change (skip initial mount)
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogOverlay className="lg:hidden" />
      <DialogContent className="items-start justify-start p-0">
        <div
          ref={containerRef}
          className="w-80 bg-background shadow-xl overflow-y-auto max-h-screen animate-fade-in"
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <DialogTitle className="text-lg font-bold">{tc("siteName")}</DialogTitle>
            <DialogClose aria-label={tc("close")} />
          </div>

          <nav className="p-3">
            {/* Home */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                pathname === "/"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Home className="h-4 w-4" />
              {tn("home")}
            </Link>

            {/* Categories */}
            <div className="mt-3 space-y-1">
              {categories.map((cat) => {
                const tools = toolsByCategory.get(cat.key) || [];
                const isExpanded = expanded === cat.key;

                return (
                  <div key={cat.key}>
                    {/* Category header - tap to expand */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(isExpanded ? null : cat.key)
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <span>{tcat(`${cat.key}.name`)}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Expanded tool list */}
                    {isExpanded && (
                      <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-border pl-3">
                        {tools.map((tool) => {
                          const toolPath = `/tools/${cat.key}/${tool.slug}`;
                          return (
                            <Link
                              key={tool.slug}
                              href={toolPath}
                              className={cn(
                                "block rounded-md px-3 py-2 text-sm transition-colors",
                                pathname === toolPath
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                              )}
                            >
                              {tool.name}
                            </Link>
                          );
                        })}

                        {/* View all link */}
                        <Link
                          href={`/tools/${cat.key}`}
                          className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
                        >
                          {tn("allCategoryTools")} →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Language & Theme */}
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 px-3">
              <LanguageSwitcher dropdownDirection="up" />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </DialogContent>
    </Dialog>
  );
}
