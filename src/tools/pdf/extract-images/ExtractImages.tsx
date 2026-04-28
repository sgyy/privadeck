"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { Button } from "@/components/ui/Button";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import {
  extractImages,
  downloadImagesAsZip,
  formatFileSize,
  type ExtractedImage,
} from "./logic";
import { brandFilename } from "@/lib/brand";

const tracker = createToolTracker("extract-images", "pdf");

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [results, setResults] = useState<ExtractedImage[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.extract-images");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    setError("");
    setPageCount(null);
    setThumbnail(null);
    try {
      const { pageCount: pc, thumbnail: thumb } = await getPdfPreview(f);
      setPageCount(pc);
      setThumbnail(thumb);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleRemoveFile() {
    setFile(null);
    setPageCount(null);
    setThumbnail(null);
    setResults([]);
    setError("");
    setProgress({ current: 0, total: 0 });
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setResults([]);
    setError("");
    const t0 = performance.now();
    try {
      const images = await extractImages(file, (current, total) => {
        setProgress({ current, total });
      });
      setResults(images);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
      if (images.length === 0) {
        setError(t("noImagesFound"));
      }
    } catch (e) {
      console.error("Extract images failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
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
    a.download = brandFilename(`${file?.name.replace(/\.pdf$/i, "")}_images.zip`);
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
      {!file && <FileDropzone accept="application/pdf" onFiles={handleFile} />}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          <PdfFilePreview
            file={file}
            pageCount={pageCount}
            thumbnail={thumbnail}
            disabled={extracting}
            onReplace={(f) => void handleFile([f])}
            onRemove={handleRemoveFile}
          />

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
