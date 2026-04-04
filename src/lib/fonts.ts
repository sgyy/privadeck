import {
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_Arabic,
  Noto_Sans_Devanagari,
  Noto_Sans_Thai,
} from "next/font/google";
import type { Locale } from "@/i18n/routing";

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-devanagari",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const notoFontClasses: Record<Locale, string> = {
  en: "",
  "zh-Hans": notoSansSC.variable,
  "zh-Hant": notoSansTC.variable,
  ja: notoSansJP.variable,
  ko: notoSansKR.variable,
  ar: notoSansArabic.variable,
  hi: notoSansDevanagari.variable,
  th: notoSansThai.variable,
  es: "",
  fr: "",
  de: "",
  "pt-BR": "",
  "pt-PT": "",
  vi: "",
  id: "",
  it: "",
  nl: "",
  pl: "",
  ru: "",
  tr: "",
  uk: "",
};

const notoFontFallback: Record<Locale, string> = {
  en: "",
  "zh-Hans": "var(--font-noto-sans-sc)",
  "zh-Hant": "var(--font-noto-sans-tc)",
  ja: "var(--font-noto-sans-jp)",
  ko: "var(--font-noto-sans-kr)",
  ar: "var(--font-noto-sans-arabic)",
  hi: "var(--font-noto-sans-devanagari)",
  th: "var(--font-noto-sans-thai)",
  es: "",
  fr: "",
  de: "",
  "pt-BR": "",
  "pt-PT": "",
  vi: "",
  id: "",
  it: "",
  nl: "",
  pl: "",
  ru: "",
  tr: "",
  uk: "",
};

export function getLocaleFontVariables(locale: Locale): { fontClasses: string; fontFallback?: string } {
  const classes = notoFontClasses[locale] || "";
  const fallback = notoFontFallback[locale] || "";
  return {
    fontClasses: classes,
    fontFallback: fallback || undefined,
  };
}
