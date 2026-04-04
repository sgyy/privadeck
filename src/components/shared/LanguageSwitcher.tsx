"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { languageNames } from "@/lib/i18n/languageNames";
import { useState, useRef, useEffect, useCallback } from "react";

interface LanguageSwitcherProps {
  dropdownDirection?: "up" | "down";
}

export function LanguageSwitcher({ dropdownDirection = "down" }: LanguageSwitcherProps = {}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setFocusedIndex(0);
      requestAnimationFrame(() => {
        listRef.current?.querySelector<HTMLElement>('[role="option"]')?.focus();
      });
    } else {
      setFocusedIndex(-1);
    }
  }, [open]);

  function switchLocale(newLocale: Locale) {
    trackEvent("language_change", { from_locale: locale, to_locale: newLocale });
    localStorage.setItem("locale", newLocale);
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
    triggerRef.current?.focus();
  }

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen((v) => !v);
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  }, [open]);

  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, locales.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0) {
          switchLocale(locales[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }, [focusedIndex]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("switchLanguage")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Languages className="h-5 w-5" />
        <span className="hidden sm:inline">
          {languageNames[(locale as Locale) ?? "en"]}
        </span>
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={t("switchLanguage")}
          className={`absolute right-0 z-50 w-48 max-h-80 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg ${dropdownDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}
          onKeyDown={handleListKeyDown}
        >
          {locales.map((l, i) => (
            <div
              key={l}
              role="option"
              aria-selected={l === locale}
              tabIndex={-1}
              onClick={() => switchLocale(l)}
              onMouseEnter={() => setFocusedIndex(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  switchLocale(l);
                }
              }}
              className={`flex w-full cursor-pointer items-center px-3 py-2 text-sm transition-colors hover:bg-muted ${
                l === locale
                  ? "font-medium text-primary"
                  : "text-card-foreground"
              }`}
            >
              {languageNames[l]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
