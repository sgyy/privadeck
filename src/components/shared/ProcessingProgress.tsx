"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

interface ProcessingProgressProps {
  /** 0–100 for determinate, undefined for indeterminate */
  progress?: number;
  /** Custom status text override */
  label?: string;
  className?: string;
}

export function ProcessingProgress({
  progress,
  label,
  className,
}: ProcessingProgressProps) {
  const t = useTranslations("common");
  const isDeterminate = progress !== undefined;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {label || t("processing")}
        </span>
        {isDeterminate && (
          <span className="font-medium tabular-nums">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {isDeterminate ? (
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
}
