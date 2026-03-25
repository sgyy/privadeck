"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { svgToPng } from "./logic";

export default function SvgToPng() {
  const t = useTranslations("tools.image.svg-to-png");
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResults([]);
    try {
      const blob = await svgToPng(file, scale);
      const baseName = file.name.replace(/\.svg$/i, "") || "image";
      setResults((prev) => [...prev, { blob, filename: `${baseName}-${scale}x.png` }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  }

  const scaleOptions = [1, 2, 3, 4];

  return (
    <div className="space-y-4">
      <FileDropzone
        accept=".svg,image/svg+xml"
        onFiles={(files) => {
          setFile(files[0]);
          setResults([]);
          setError(null);
        }}
      />

      {file && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          {file.name}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("scaleFactor")}</label>
        <div className="flex gap-2">
          {scaleOptions.map((s) => (
            <Button
              key={s}
              variant={scale === s ? "primary" : "outline"}
              size="sm"
              onClick={() => setScale(s)}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={handleProcess} disabled={!file || processing}>
        {processing ? t("processing") : t("convert")}
      </Button>

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
