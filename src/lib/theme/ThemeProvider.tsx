"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number] | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function getStoredTheme(fallback: Theme = "system"): Theme {
  if (typeof window === "undefined") return fallback;
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme) || fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove(...THEMES);
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/** Blocking inline script to prevent FOUC. Runs before first paint. */
export const themeInitScript = `try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=t==='system'?(window.matchMedia('${MEDIA_QUERY}').matches?'dark':'light'):t;document.documentElement.classList.add(d);document.documentElement.style.colorScheme=d;}catch(e){}`;

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  const resolvedTheme = theme === "system" ? systemTheme : (theme as "light" | "dark");

  // Hydrate from localStorage + system preference on mount, and apply immediately
  useEffect(() => {
    const stored = getStoredTheme(defaultTheme);
    const sys = getSystemTheme();
    setThemeState(stored);
    setSystemTheme(sys);
    applyTheme(stored);
  }, [defaultTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
      if (getStoredTheme(defaultTheme) === "system") applyTheme("system");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [defaultTheme]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setThemeState(e.newValue as Theme);
        applyTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch { /* noop */ }
    applyTheme(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
