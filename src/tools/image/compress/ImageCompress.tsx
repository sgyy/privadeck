"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { X } from "lucide-react";
import {
  compressImage,
  formatFileSize,
  RESOLUTION_PRESETS,
} from "./logic";

export default function ImageCompress() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxSize, setMaxSize] = useState(2);
  const [maxResolution, setMaxResolution] = useState(0);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.compress");

  async function handleCompress() {
    if (files.length === 0) return;
    setCompressing(true);
    setError("");
    try {
      const resolution = maxResolution || 16384;
      const compressed = await Promise.all(
        files.map((f) => compressImage(f, quality, maxSize, resolution)),
      );
      const newItems: ImageResultItem[] = compressed.map((r) => {
        const savingsText =
          r.savings > 0
            ? `-${r.savings}%`
            : `+${Math.abs(r.savings)}%`;
        return {
          blob: r.compressed,
          filename: r.original.name,
          meta: `${formatFileSize(r.originalSize)} → ${formatFileSize(r.compressedSize)} (${savingsText})`,
        };
      });
      setResults((prev) => [...newItems, ...prev]);
    } catch (e) {
      console.error("Compression failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setCompressing(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/*"
        multiple
        onFiles={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
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
            className="w-40"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("maxSize")}: {maxSize} MB
          </label>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={maxSize}
            onChange={(e) => setMaxSize(Number(e.target.value))}
            className="w-40"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("maxResolution")}
          </label>
          <Select
            value={String(maxResolution)}
            onChange={(e) => setMaxResolution(Number(e.target.value))}
          >
            {RESOLUTION_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <Button
          onClick={handleCompress}
          disabled={files.length === 0 || compressing}
        >
          {compressing ? t("compressing") : t("compress")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("results")}</h3>
          <ImageResultList
            results={results}
            onRemove={(i) =>
              setResults((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </div>
      )}
    </div>
  );
}
