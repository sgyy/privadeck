"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { categories } from "@/lib/registry/categories";
import { cn } from "@/lib/utils/cn";
import {
  Type,
  Code,
  ImageIcon,
  Home,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";

const iconMap: Record<string, LucideIcon> = {
  Type,
  Code,
  Image: ImageIcon,
};

interface SidebarProps {
  className?: string;
  toolNavData: ToolNavItem[];
}

export function Sidebar({ className, toolNavData }: SidebarProps) {
  const t = useTranslations("nav");
  const tc = useTranslations("categories");
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

  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r border-border bg-background overflow-y-auto",
        className,
      )}
    >
      <nav className="p-4 space-y-1">
        {/* Home */}
        <SidebarLink
          href="/"
          icon={Home}
          label={t("home")}
          active={pathname === "/"}
        />

        {/* All tools */}
        <SidebarLink
          href="/tools"
          icon={LayoutGrid}
          label={t("tools")}
          active={pathname === "/tools"}
        />

        {/* Categories */}
        <div className="pt-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || LayoutGrid;
            const tools = toolsByCategory.get(cat.key) || [];
            const catPath = `/tools/${cat.key}`;
            const isCatActive =
              pathname === catPath || pathname.startsWith(`${catPath}/`);

            return (
              <div key={cat.key} className="mb-2">
                <SidebarLink
                  href={catPath}
                  icon={Icon}
                  label={tc(`${cat.key}.name`)}
                  active={pathname === catPath}
                  className="font-medium"
                />
                {isCatActive && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {tools.map((tool) => {
                      const toolPath = `/tools/${cat.key}/${tool.slug}`;
                      return (
                        <Link
                          key={tool.slug}
                          href={toolPath}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors",
                            pathname === toolPath
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted",
                          )}
                        >
                          {tool.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  className,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
