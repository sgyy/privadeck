import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Detect the best matching locale from browser language preferences.
 * Returns defaultLocale ("en") if no match or running on server.
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  const browserLangs = navigator.languages || [navigator.language];
  const localeArr = locales as readonly string[];

  for (const lang of browserLangs) {
    const normalized = lang.replace("_", "-");

    // Exact match
    const exact = localeArr.find(
      (l) => l.toLowerCase() === normalized.toLowerCase(),
    );
    if (exact) return exact as Locale;

    const parts = normalized.split("-");

    // Region pattern match (e.g. pt-BR from pt-BR)
    if (parts.length >= 2) {
      const langRegion = `${parts[0]}-${parts[parts.length - 1]}`;
      const regionMatch = localeArr.find(
        (l) => l.toLowerCase() === langRegion.toLowerCase(),
      );
      if (regionMatch) return regionMatch as Locale;
    }

    // Chinese special handling (case-insensitive for Android WebView etc.)
    if (parts[0].toLowerCase() === "zh") {
      const normLower = normalized.toLowerCase();
      if (
        normLower.includes("hant") ||
        normLower.includes("tw") ||
        normLower.includes("hk") ||
        normLower.includes("mo")
      ) {
        return "zh-Hant";
      }
      return "zh-Hans";
    }

    // Portuguese default
    const prefix = parts[0].toLowerCase();
    if (prefix === "pt") return "pt-BR";

    // Language prefix match (e.g. es from es-MX)
    const prefixMatch = localeArr.find((l) => l.toLowerCase() === prefix);
    if (prefixMatch) return prefixMatch as Locale;
  }

  return defaultLocale;
}
