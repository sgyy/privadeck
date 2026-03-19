"use client";

import { cn } from "@/lib/utils/cn";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, showCount, value, maxLength, ...props }, ref) => {
    const length = typeof value === "string" ? value.length : 0;

    return (
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px] resize-y",
            className,
          )}
          {...props}
        />
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
