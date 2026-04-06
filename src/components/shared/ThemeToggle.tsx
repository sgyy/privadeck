"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { trackEvent } from "@/lib/analytics";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common");
  const isClient = useIsClient();

  if (!isClient) {
    return <div className="h-10 w-10" />;
  }

  const next =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => { setTheme(next); trackEvent("theme_change", { theme: next }); }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={t("switchTheme", { theme: next })}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
