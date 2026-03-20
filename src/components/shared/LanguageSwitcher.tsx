"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const languageNames: Record<Locale, string> = {
  en: "English",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  hi: "हिन्दी",
  ar: "العربية",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  ru: "Русский",
  tr: "Türkçe",
  uk: "Українська",
};

interface LanguageSwitcherProps {
  dropdownDirection?: "up" | "down";
}

export function LanguageSwitcher({ dropdownDirection = "down" }: LanguageSwitcherProps = {}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(newLocale: Locale) {
    localStorage.setItem("locale", newLocale);
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("switchLanguage")}
      >
        <Languages className="h-5 w-5" />
        <span className="hidden sm:inline">
          {languageNames[locale as Locale]}
        </span>
      </button>
      {open && (
        <div className={`absolute right-0 z-50 w-48 max-h-80 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg ${dropdownDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}>
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLocale(l)}
              className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted ${
                l === locale
                  ? "font-medium text-primary"
                  : "text-card-foreground"
              }`}
            >
              {languageNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
