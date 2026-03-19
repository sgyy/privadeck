import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
}

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
];

export async function recognizeText(
  file: File,
  language: string,
  onProgress?: (progress: number) => void,
): Promise<OcrResult> {
  const result = await Tesseract.recognize(file, language, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return {
    text: result.data.text,
    confidence: Math.round(result.data.confidence),
  };
}
