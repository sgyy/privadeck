"use client";

import { cn } from "@/lib/utils/cn";
import { TextareaHTMLAttributes, forwardRef, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { useTextFileDrop } from "@/hooks/useTextFileDrop";

const noop = () => {};

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
  onFileDrop?: (text: string, filename: string) => void;
  acceptFileTypes?: string[];
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, showCount, value, maxLength, onFileDrop, acceptFileTypes, ...props }, ref) => {
    const length = typeof value === "string" ? value.length : 0;
    const isEmpty = !value || (typeof value === "string" && value.length === 0);
    const t = useTranslations("common");

    const callbackRef = useRef(onFileDrop ?? noop);
    callbackRef.current = onFileDrop ?? noop;
    const stableCallback = useCallback(
      (text: string, filename: string) => callbackRef.current(text, filename),
      [],
    );

    const drop = useTextFileDrop(
      stableCallback,
      acceptFileTypes ? { accept: acceptFileTypes } : undefined,
    );

    const hasFileDrop = !!onFileDrop;

    return (
      <div className="relative" {...(hasFileDrop ? drop.dragHandlers : {})}>
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px] resize-y",
            hasFileDrop && drop.isDragging && "ring-2 ring-primary border-primary",
            className,
          )}
          {...props}
        />
        {hasFileDrop && drop.isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 backdrop-blur-[1px] pointer-events-none">
            <span className="text-sm font-medium text-primary">
              {t("dropTextFile")}
            </span>
          </div>
        )}
        {hasFileDrop && isEmpty && !drop.isDragging && (
          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
            <Upload className="h-3 w-3" />
            {t("dropTextFileHint")}
          </div>
        )}
        {showCount && (
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {length}
            {maxLength ? `/${maxLength}` : ""}
          </span>
        )}
      </div>
    );
  },
);
TextArea.displayName = "TextArea";
