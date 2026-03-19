import { cn } from "@/lib/utils/cn";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";
