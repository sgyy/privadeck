"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("locale");
    if (stored && (locales as readonly string[]).includes(stored)) {
      router.replace(`/${stored}`);
      return;
    }

    const browserLangs = navigator.languages || [navigator.language];
    let matched: Locale = defaultLocale;

    // Map browser locale tags to our locale codes
    // e.g. "zh-CN" → "zh-CN", "zh-TW"/"zh-Hant" → "zh-TW", "pt-BR" → "pt-BR", "pt"/"pt-PT" → "pt-PT"
    const localeArr = locales as readonly string[];

    for (const lang of browserLangs) {
      // Try exact match first (e.g. "zh-CN" matches "zh-CN")
      const normalized = lang.replace("_", "-");
      const exact = localeArr.find(
        (l) => l.toLowerCase() === normalized.toLowerCase(),
      );
      if (exact) {
        matched = exact as Locale;
        break;
      }

      // Try language-region match (e.g. "zh-Hans-CN" → "zh-CN")
      const parts = normalized.split("-");
      if (parts.length >= 2) {
        const langRegion = `${parts[0]}-${parts[parts.length - 1]}`;
        const regionMatch = localeArr.find(
          (l) => l.toLowerCase() === langRegion.toLowerCase(),
        );
        if (regionMatch) {
          matched = regionMatch as Locale;
          break;
        }
      }

      // Handle Chinese variants: zh-Hant/zh-TW/zh-HK → zh-hant, zh-Hans/zh-CN/zh → zh-hans
      if (parts[0].toLowerCase() === "zh") {
        if (normalized.includes("Hant") || normalized.includes("TW") || normalized.includes("HK") || normalized.includes("MO")) {
          matched = "zh-Hant";
        } else {
          matched = "zh-Hans";
        }
        break;
      }

      // Fallback: match by language prefix with default region
      const prefix = parts[0].toLowerCase();
      if (prefix === "pt") {
        matched = "pt-BR"; // Default Portuguese to Brazilian
        break;
      }
      const prefixMatch = localeArr.find((l) => l.toLowerCase() === prefix);
      if (prefixMatch) {
        matched = prefixMatch as Locale;
        break;
      }
    }

    localStorage.setItem("locale", matched);
    router.replace(`/${matched}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
