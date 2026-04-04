"use client";

import { cn } from "@/lib/utils/cn";
import { createContext, useContext, useState, ReactNode, useId, useCallback } from "react";

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  baseId: string;
  values: string[];
  registerValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: "",
  onChange: () => {},
  baseId: "",
  values: [],
  registerValue: () => {},
});

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolled;
  const onChange = onValueChange ?? setUncontrolled;
  const baseId = useId();
  const [values, setValues] = useState<string[]>([]);

  const registerValue = useCallback((v: string) => {
    setValues((prev) => prev.includes(v) ? prev : [...prev, v]);
  }, []);

  return (
    <TabsContext.Provider value={{ value, onChange, baseId, values, registerValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted/70 backdrop-blur-sm p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: selected, onChange, baseId, values, registerValue } = useContext(TabsContext);
  const isActive = selected === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const currentIndex = values.indexOf(value);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        if (values.length > 0) {
          const prevIndex = (currentIndex - 1 + values.length) % values.length;
          onChange(values[prevIndex]);
        }
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        if (values.length > 0) {
          const nextIndex = (currentIndex + 1) % values.length;
          onChange(values[nextIndex]);
        }
        break;
      case "Home":
        e.preventDefault();
        if (values.length > 0) onChange(values[0]);
        break;
      case "End":
        e.preventDefault();
        if (values.length > 0) onChange(values[values.length - 1]);
        break;
    }
  }, [values, currentIndex, onChange]);

  registerValue(value);

  return (
    <button
      type="button"
      id={tabId}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      onClick={() => onChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-background text-foreground shadow-sm ring-1 ring-primary/20"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: selected, baseId } = useContext(TabsContext);
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (selected !== value) return null;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className={cn("mt-4", className)}
    >
      {children}
    </div>
  );
}
