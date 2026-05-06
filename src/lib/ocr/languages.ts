export const OCR_LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "chi_sim", label: "简体中文" },
  { code: "chi_tra", label: "繁體中文" },
  { code: "jpn", label: "日本語" },
  { code: "kor", label: "한국어" },
  { code: "spa", label: "Español" },
  { code: "fra", label: "Français" },
  { code: "deu", label: "Deutsch" },
  { code: "por", label: "Português" },
  { code: "ara", label: "العربية" },
  { code: "rus", label: "Русский" },
  { code: "hin", label: "हिन्दी" },
] as const;

export type OcrLanguageCode = (typeof OCR_LANGUAGES)[number]["code"];
