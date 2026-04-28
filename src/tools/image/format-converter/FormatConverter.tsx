"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { createToolTracker } from "@/lib/analytics";
import {
  convertImage,
  formatFileSize,
  type OutputFormat,
} from "./logic";

const tracker = createToolTracker("format-converter", "image");

export default function FormatConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.format-converter");

  async function handleConvert() {
    if (files.length === 0) return;
    setConverting(true);
    setResults([]);
    setProgress({ done: 0, total: files.length });
    setError("");

    for (const file of files) {
      const t0 = performance.now();
      try {
        const r = await convertImage(file, format, quality / 100);
        const item: ImageResultItem = {
          blob: r.blob,
          filename: r.filename,
          meta: `${r.width}×${r.height} · ${formatFileSize(r.originalSize)} → ${formatFileSize(r.convertedSize)}`,
        };
        setResults((prev) => [...prev, item]);
        tracker.trackProcessComplete(Math.round(performance.now() - t0));
      } catch (e) {
        console.error(`Conversion failed for ${file.name}:`, e);
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        setError((prev) =>
          prev ? `${prev}\n${file.name}: ${msg}` : `${file.name}: ${msg}`,
        );
      }
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    setConverting(false);
  }

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={setFiles}
        disabled={converting}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("selectFormat")}
          </label>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
            <option value="ico">ICO</option>
          </Select>
        </div>

        {(format === "jpeg" || format === "webp" || format === "avif") && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("quality")}: {quality}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-32"
            />
          </div>
        )}

        <Button
          onClick={handleConvert}
          disabled={files.length === 0 || converting}
        >
          {converting ? t("converting") : t("convert")}
        </Button>
        {converting && (
          <span className="text-sm text-muted-foreground">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </pre>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t("converted")}</h3>
          <ImageResultList
            results={results}
            onRemove={(i) =>
              setResults((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t("supportedFormats")}
      </p>
    </div>
  );
}
