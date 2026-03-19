"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { addWatermark, formatFileSize } from "./logic";

export default function AddWatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.add-watermark");

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
  }

  async function handleApply() {
    if (!file || !text.trim()) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await addWatermark(file, {
        text: text.trim(),
        opacity,
        fontSize,
      });
      setResult(blob);
    } catch (e) {
      console.error("Add watermark failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" onFiles={handleFile} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            {file.name} — {formatFileSize(file.size)}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("watermarkText")}</label>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              placeholder={t("textPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("opacity")}: {opacity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={opacity}
              onChange={(e) => {
                setOpacity(parseFloat(e.target.value));
                setResult(null);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1</span>
              <span>0.5</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("fontSize")}: {fontSize}px
            </label>
            <input
              type="range"
              min="20"
              max="80"
              step="2"
              value={fontSize}
              onChange={(e) => {
                setFontSize(parseInt(e.target.value, 10));
                setResult(null);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>20px</span>
              <span>80px</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleApply}
              disabled={processing || !text.trim()}
            >
              {processing ? t("processing") : t("apply")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={file.name.replace(/\.pdf$/i, "_watermarked.pdf")}
              />
            )}
          </div>

          {result && (
            <p className="text-sm text-muted-foreground">
              {formatFileSize(result.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
