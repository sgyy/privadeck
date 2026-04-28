"use client";

import { createContext, useContext } from "react";

type ToolAnalytics = { slug: string; category: string } | null;

const ToolAnalyticsContext = createContext<ToolAnalytics>(null);

export const ToolAnalyticsProvider = ToolAnalyticsContext.Provider;

export function useToolAnalytics(): ToolAnalytics {
  return useContext(ToolAnalyticsContext);
}
