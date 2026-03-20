"use client";

import { createContext, useContext } from "react";
import type { ToolNavItem } from "./toolNavData";

const ToolNavContext = createContext<ToolNavItem[]>([]);

export function ToolNavProvider({
  children,
  data,
}: {
  children: React.ReactNode;
  data: ToolNavItem[];
}) {
  return (
    <ToolNavContext.Provider value={data}>{children}</ToolNavContext.Provider>
  );
}

export function useToolNavData(): ToolNavItem[] {
  return useContext(ToolNavContext);
}
