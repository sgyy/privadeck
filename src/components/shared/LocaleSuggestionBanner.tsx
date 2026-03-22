"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import { X, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";
import { detectBrowserLocale } from "@/lib/i18n/detectLocale";
import { languageNames } from "@/lib/i18n/languageNames";

const DISMISSED_KEY = "locale-banner-dismissed";
const LOCALE_KEY = "locale";

const emptySubscribe = () => () => {};

function computeSuggestion(currentLocale: string): Locale | null {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem(DISMISSED_KEY)) return null;

  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored && (locales as readonly string[]).includes(stored)) {
    return stored !== currentLocale ? (stored as Locale) : null;
  }

  const detected = detectBrowserLocale();
  return detected !== currentLocale ? detected : null;
}

interface LocaleSuggestionBannerProps {
  currentLocale: string;
}

export function LocaleSuggestionBanner({ currentLocale }: LocaleSuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations("common");

  const getSnapshot = useCallback(
    () => (dismissed ? null : computeSuggestion(currentLocale)),
    [currentLocale, dismissed],
  );
  const getServerSnapshot = useCallback(() => null, []);

  const suggestedLocale = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!suggestedLocale) return null;

  const langName = languageNames[suggestedLocale];

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  function handleSwitch() {
    localStorage.setItem(LOCALE_KEY, suggestedLocale!);
    const currentPath = window.location.pathname;
    let targetPath: string;
    if (currentPath === "/" || currentPath === "") {
      targetPath = `/${suggestedLocale}/`;
    } else {
      const localePrefix = `/${currentLocale}/`;
      if (currentPath.startsWith(localePrefix)) {
        targetPath = `/${suggestedLocale}/${currentPath.slice(localePrefix.length)}`;
      } else {
        targetPath = `/${suggestedLocale}/`;
      }
    }
    window.location.href = targetPath + window.location.search + window.location.hash;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground/80">
              {t("localeBanner.message", { language: langName })}
            </span>
            <button
              type="button"
              onClick={handleSwitch}
              className="cursor-pointer font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {t("localeBanner.switchTo", { language: langName })}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="cursor-pointer shrink-0 rounded-md p-1 text-foreground/60 hover:text-foreground hover:bg-primary/10 transition-colors"
            aria-label={t("localeBanner.dismiss")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
