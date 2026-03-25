"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { convertHeic, type OutputFormat } from "./logic";

export default function HeicConvert() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.85);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.heic-convert");

  function handleFiles(files: File[]) {
    if (files.length > 0) {
      setFile(files[0]);
      setResults([]);
      setError("");
    }
  }

  async function handleConvert() {
    if (!file) return;
    setProcessing(true);
    setError("");
    setResults([]);
    try {
      const blob = await convertHeic(file, format, quality);
      const ext = format === "image/jpeg" ? "jpg" : "png";
      const base = file.name.replace(/\.[^.]+$/, "") || "converted";
      setResults((prev) => [...prev, { blob, filename: `${base}.${ext}` }]);
    } catch (e) {
      console.error("HEIC conversion failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept=".heic,.heif,image/heic,image/heif"
        onFiles={handleFiles}
      />

      {file && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("selectedFile")}: <span className="font-medium text-foreground">{file.name}</span>
          </p>

          {/* Format selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("outputFormat")}</label>
            <div className="flex gap-2">
              <Button
                variant={format === "image/jpeg" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFormat("image/jpeg")}
              >
                JPG
              </Button>
              <Button
                variant={format === "image/png" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFormat("image/png")}
              >
                PNG
              </Button>
            </div>
          </div>

          {/* Quality slider (JPG only) */}
          {format === "image/jpeg" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("quality")}: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <Button
            onClick={handleConvert}
            disabled={processing}
          >
            {processing ? t("processing") : t("convert")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <ImageResultList
          results={results}
          onRemove={(i) => setResults((prev) => prev.filter((_, idx) => idx !== i))}
        />
      )}
    </div>
  );
}
