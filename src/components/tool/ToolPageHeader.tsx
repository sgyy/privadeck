"use client";

import { DynamicToolIcon } from "@/components/shared/DynamicToolIcon";
import { getCategoryTheme } from "@/lib/theme/categoryThemes";
import type { ToolCategory } from "@/lib/registry/types";

interface ToolPageHeaderProps {
  icon: string;
  category: ToolCategory;
  name: string;
  description: string;
}

export function ToolPageHeader({ icon, category, name, description }: ToolPageHeaderProps) {
  const theme = getCategoryTheme(category);

  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconBgDark}`}
      >
        <DynamicToolIcon name={icon} className={`${theme.iconColor} ${theme.iconColorDark}`} size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {name}
        </h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
