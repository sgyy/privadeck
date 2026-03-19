import { defineRouting } from "next-intl/routing";

export const locales = [
  "en", "zh-Hans", "zh-Hant", "ja", "ko",
  "es", "fr", "de", "pt-BR", "pt-PT",
  "th", "vi", "id", "hi", "ar",
  "it", "nl", "pl", "ru", "tr", "uk",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: Locale[] = ["ar"];

export const routing = defineRouting({
  locales,
  defaultLocale,
});
