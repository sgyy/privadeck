import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
}

export { OCR_LANGUAGES } from "@/lib/ocr/languages";

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
