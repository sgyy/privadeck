import { Geist, Geist_Mono } from "next/font/google";
import type { Locale } from "@/i18n/routing";

/**
 * Geist: 现代 Latin UI 字体，构建时自托管，体积小 (~50-100KB)。
 * CJK/Arabic/Thai/Devanagari: 使用各平台原生系统字体，零额外下载。
 */

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 各 locale 的系统字体栈（仅用于非 Latin 书写系统）。
 * Latin 语言直接使用 Geist，无需额外字体栈。
 */
const localeFontStacks: Record<Locale, string> = {
  // Latin 语言 - 直接使用 Geist，无需覆盖
  en: "",
  es: "",
  fr: "",
  de: "",
  "pt-BR": "",
  "pt-PT": "",
  it: "",
  nl: "",
  pl: "",
  tr: "",
  vi: "",
  id: "",

  // Cyrillic - system-ui 在各平台均良好支持西里尔字母
  ru: "",
  uk: "",

  // 简体中文
  "zh-Hans":
    '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", system-ui, sans-serif',

  // 繁体中文
  "zh-Hant":
    '"PingFang TC", "Hiragino Sans CNS", "Microsoft JhengHei", "Noto Sans CJK TC", "Source Han Sans TC", system-ui, sans-serif',

  // 日文
  ja: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, "Noto Sans CJK JP", "Source Han Sans JP", system-ui, sans-serif',

  // 韩文
  ko: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "Source Han Sans KR", system-ui, sans-serif',

  // 阿拉伯文
  ar: '"Segoe UI", Tahoma, system-ui, sans-serif',

  // 印地语（天城文）
  hi: '"Kohinoor Devanagari", "Noto Sans Devanagari", Mangal, system-ui, sans-serif',

  // 泰文
  th: '"Leelawadee UI", Thonburi, system-ui, sans-serif',
};

export function getLocaleFontFallback(locale: Locale): string | undefined {
  return localeFontStacks[locale] || undefined;
}
