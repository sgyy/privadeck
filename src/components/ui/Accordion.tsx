"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";
import { useState, ReactNode, useId } from "react";

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("divide-y divide-border", className)}>{children}</div>;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  onValueChange,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  onValueChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  return (
    <div>
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          const next = !open;
          setOpen(next);
          onValueChange?.(next);
        }}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-colors hover:text-foreground/80"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[5000px] pb-4 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="text-sm text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
