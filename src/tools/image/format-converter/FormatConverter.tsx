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
import {
  convertImage,
  formatFileSize,
  type OutputFormat,
} from "./logic";

export default function FormatConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [converting, setConverting] = useState(false);
  const t = useTranslations("tools.image.format-converter");

  async function handleConvert() {
    if (files.length === 0) return;
    setConverting(true);

    try {
      const converted = await Promise.all(
        files.map((file) => convertImage(file, format, quality / 100)),
      );
      const newItems: ImageResultItem[] = converted.map((r) => ({
        blob: r.blob,
        filename: r.filename,
        meta: `${r.width}×${r.height} · ${formatFileSize(r.originalSize)} → ${formatFileSize(r.convertedSize)}`,
      }));
      setResults((prev) => [...newItems, ...prev]);
    } catch (e) {
      console.error("Conversion failed:", e);
    } finally {
      setConverting(false);
    }
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
            <option value="ico">ICO</option>
          </Select>
        </div>

        {(format === "jpeg" || format === "webp") && (
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
      </div>

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
