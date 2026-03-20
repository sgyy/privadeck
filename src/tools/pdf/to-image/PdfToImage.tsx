"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Download, X } from "lucide-react";
import { brandFilename } from "@/lib/brand";
import {
  convertPdfToImages,
  downloadAsZip,
  formatFileSize,
  type ConvertedPage,
} from "./logic";

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(2);
  const [results, setResults] = useState<ConvertedPage[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const generationRef = useRef(0);
  const urlMapRef = useRef<Map<Blob, string>>(new Map());
  const t = useTranslations("tools.pdf.to-image");
  const tc = useTranslations("common");

  // Ref-based URL management: only create URLs for new blobs
  const getUrl = useCallback((blob: Blob) => {
    const map = urlMapRef.current;
    let url = map.get(blob);
    if (!url) {
      url = URL.createObjectURL(blob);
      map.set(blob, url);
    }
    return url;
  }, []);

  // Cleanup URLs for blobs no longer in results
  useEffect(() => {
    const map = urlMapRef.current;
    const currentBlobs = new Set(results.map((r) => r.blob));
    for (const [blob, url] of map) {
      if (!currentBlobs.has(blob)) {
        URL.revokeObjectURL(url);
        map.delete(blob);
      }
    }
  }, [results]);

  // Cleanup all URLs on unmount
  useEffect(() => {
    const map = urlMapRef.current;
    return () => {
      for (const url of map.values()) {
        URL.revokeObjectURL(url);
      }
      map.clear();
    };
  }, []);

  // Close preview on Escape
  useEffect(() => {
    if (previewIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewIndex(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex]);

  function removePage(index: number) {
    setResults((prev) => prev.filter((_, i) => i !== index));
    if (previewIndex === index) setPreviewIndex(null);
    else if (previewIndex !== null && previewIndex > index) {
      setPreviewIndex(previewIndex - 1);
    }
  }

  async function handleConvert() {
    if (!file) return;
    const gen = ++generationRef.current;
    setConverting(true);
    setResults([]);
    setError("");
    try {
      await convertPdfToImages(
        file,
        { format, quality, scale },
        (current, total) => {
          if (generationRef.current !== gen) return;
          setProgress({ current, total });
        },
        (page) => {
          if (generationRef.current !== gen) return;
          setResults((prev) => [...prev, page]);
        },
      );
    } catch (e) {
      if (generationRef.current !== gen) return;
      console.error("Conversion failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      if (generationRef.current === gen) setConverting(false);
    }
  }

  async function handleDownloadAll() {
    if (results.length === 0) return;
    const zip = await downloadAsZip(results);
    const url = URL.createObjectURL(zip);
    const a = document.createElement("a");
    a.href = url;
    a.download = brandFilename(`${file?.name.replace(/\.pdf$/i, "")}_images.zip`);
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" onFiles={(f) => { setFile(f[0]); setError(""); }} />

      {file && (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("format")}</label>
            <Select value={format} onChange={(e) => setFormat(e.target.value as "png" | "jpeg")}>
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
            </Select>
          </div>

          {format === "jpeg" && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t("quality")}: {quality}%</label>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-32" />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">{t("scale")}: {scale}x</label>
            <input type="range" min={1} max={4} step={0.5} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-32" />
          </div>

          <Button onClick={handleConvert} disabled={converting}>
            {converting
              ? `${t("converting")} (${progress.current}/${progress.total})`
              : t("convert")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {converting
                ? `${progress.current}/${progress.total} ${t("pages")}`
                : `${results.length} ${t("pages")}`}
            </h3>
            {!converting && <Button variant="outline" size="sm" onClick={handleDownloadAll}>{t("downloadAll")}</Button>}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {results.map((page, i) => (
              <div key={page.pageNumber} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                <button type="button" onClick={() => setPreviewIndex(i)} className="block w-full cursor-zoom-in">
                  <img src={getUrl(page.blob)} alt={`Page ${page.pageNumber}`} className="w-full" />
                </button>
                <button
                  type="button"
                  onClick={() => removePage(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{formatFileSize(page.blob.size)}</p>
                  <div className="mt-1.5">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => {
                      const url = getUrl(page.blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = brandFilename(page.filename);
                      a.click();
                    }}>
                      <Download className="h-3.5 w-3.5" />
                      {tc("download")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox preview */}
      {previewIndex !== null && results[previewIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={getUrl(results[previewIndex].blob)}
            alt={`Page ${results[previewIndex].pageNumber}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
