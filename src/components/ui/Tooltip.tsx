"use client";

import { cn } from "@/lib/utils/cn";
import { useState, useId, type ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const placementClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowPlacementClasses: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1",
};

export function Tooltip({ children, content, placement = "top", className }: TooltipProps) {
  const [show, setShow] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <span aria-describedby={show ? tooltipId : undefined}>
        {children}
      </span>
      {show && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg animate-fade-in-scale pointer-events-none",
            placementClasses[placement],
            className,
          )}
        >
          {content}
          <div
            className={cn(
              "absolute h-2 w-2 rotate-45 bg-foreground",
              arrowPlacementClasses[placement],
            )}
          />
        </div>
      )}
    </div>
  );
}
