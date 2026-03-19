"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/Button";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import {
  extractImages,
  downloadImagesAsZip,
  formatFileSize,
  type ExtractedImage,
} from "./logic";

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ExtractedImage[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.extract-images");

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    setError("");
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setResults([]);
    setError("");
    try {
      const images = await extractImages(file, (current, total) => {
        setProgress({ current, total });
      });
      setResults(images);
      if (images.length === 0) {
        setError(t("noImagesFound"));
      }
    } catch (e) {
      console.error("Extract images failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setExtracting(false);
    }
  }

  async function handleDownloadAll() {
    if (results.length === 0) return;
    const zip = await downloadImagesAsZip(results);
    const url = URL.createObjectURL(zip);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.pdf$/i, "")}_images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleRemove = useCallback((index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Convert ExtractedImage[] to ImageResultItem[] for the shared component
  const imageResultItems: ImageResultItem[] = results.map((img) => ({
    blob: img.blob,
    filename: img.filename,
    meta: `${img.width}x${img.height} — ${t("page")} ${img.page} — ${formatFileSize(img.blob.size)}`,
  }));

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

          <Button onClick={handleExtract} disabled={extracting}>
            {extracting
              ? `${t("extracting")} (${progress.current}/${progress.total})`
              : t("extract")}
          </Button>

          {/* Progress bar */}
          {extracting && progress.total > 0 && (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {results.length} {t("imagesFound")}
                </h3>
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  {t("downloadAllZip")}
                </Button>
              </div>
              <ImageResultList
                results={imageResultItems}
                onRemove={handleRemove}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
