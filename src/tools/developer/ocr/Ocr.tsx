"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { recognizeText, OCR_LANGUAGES, type OcrResult } from "./logic";

export default function Ocr() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("eng");
  const [result, setResult] = useState<OcrResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const previewUrl = useObjectUrl(file);
  const t = useTranslations("tools.developer.ocr");

  function handleFile(files: File[]) {
    setFile(files[0] || null);
    setResult(null);
    setError("");
  }

  async function handleRecognize() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const r = await recognizeText(file, language, setProgress);
      setResult(r);
    } catch (e) {
      console.error("OCR failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/*" onFiles={handleFile} />

      {previewUrl && (
        <div className="overflow-hidden rounded-lg border border-border">
          <img src={previewUrl} alt="Upload preview" className="max-h-[300px] w-full object-contain" />
        </div>
      )}

      {file && (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("language")}</label>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {OCR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </Select>
          </div>
          <Button onClick={handleRecognize} disabled={processing}>
            {processing ? `${t("recognizing")} ${progress}%` : t("recognize")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("confidence")}: {result.confidence}%</span>
            <CopyButton text={result.text} />
          </div>
          <textarea
            readOnly
            value={result.text}
            className="min-h-[200px] w-full rounded-lg border border-border bg-background p-3 text-sm font-mono"
          />
        </div>
      )}
    </div>
  );
}
