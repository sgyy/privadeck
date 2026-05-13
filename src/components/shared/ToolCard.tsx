"use client";

import { Card } from "@/components/ui/Card";
import { DynamicToolIcon } from "@/components/shared/DynamicToolIcon";
import { getCategoryTheme } from "@/lib/theme/categoryThemes";
import type { ToolCategory } from "@/lib/registry/types";

interface ToolCardProps {
  icon: string;
  category: ToolCategory;
  name: string;
  description: string;
  showBadge?: boolean;
  badgeLabel?: string;
  className?: string;
}

export function ToolCard({
  icon,
  category,
  name,
  description,
  showBadge = false,
  badgeLabel,
  className = "",
}: ToolCardProps) {
  const theme = getCategoryTheme(category);

  return (
    <Card
      className={`p-4 h-full transition-all duration-200 group hover:shadow-[var(--shadow-card-hover)] ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${theme.iconBg} ${theme.iconBgDark} transition-transform duration-200 group-hover:scale-105`}
        >
          <DynamicToolIcon
            name={icon}
            className={`${theme.iconColor} ${theme.iconColorDark}`}
            size={18}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight">{name}</h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
          {showBadge && badgeLabel && (
            <span className="inline-block mt-1.5 text-xs text-muted-foreground/70">
              {badgeLabel}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
