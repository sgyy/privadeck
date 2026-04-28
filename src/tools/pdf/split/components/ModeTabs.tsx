"use client";

import { useTranslations } from "next-intl";
import {
  FileText,
  Layers,
  Binary,
  SplitSquareHorizontal,
  ListOrdered,
  Scale,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SplitMode } from "../logic";

interface ModeTabsProps {
  mode: SplitMode;
  onChange: (mode: SplitMode) => void;
  disabledModes?: Partial<Record<SplitMode, string>>;
}

const TAB_ITEMS: { id: SplitMode; Icon: typeof FileText }[] = [
  { id: "each", Icon: FileText },
  { id: "every", Icon: Layers },
  { id: "oddEven", Icon: Binary },
  { id: "half", Icon: SplitSquareHorizontal },
  { id: "range", Icon: ListOrdered },
  { id: "size", Icon: Scale },
  { id: "outline", Icon: Bookmark },
];

export function ModeTabs({ mode, onChange, disabledModes }: ModeTabsProps) {
  const t = useTranslations("tools.pdf.split.modes");

  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {TAB_ITEMS.map(({ id, Icon }) => {
        const disabledReason = disabledModes?.[id];
        const isDisabled = Boolean(disabledReason);
        const isActive = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(id)}
            title={disabledReason}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/30"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              isDisabled && "opacity-50 cursor-not-allowed hover:border-border hover:text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{t(`${id}.title`)}</span>
          </button>
        );
      })}
    </div>
  );
}
