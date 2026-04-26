"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { Button } from "@/components/ui/Button";
import { Download, FileText, RefreshCw, X } from "lucide-react";
import { brandFilename } from "@/lib/brand";
import { getPdfjs } from "@/lib/pdfjs";
import {
  convertPdfToImages,
  downloadAsZip,
  formatFileSize,
  type ConvertedPage,
} from "./logic";

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
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
  const replaceInputRef = useRef<HTMLInputElement>(null);
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

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    const gen = ++generationRef.current;
    setFile(f);
    setError("");
    setResults([]);
    setPageCount(null);
    setThumbnail(null);
    setProgress({ current: 0, total: 0 });
    setPreviewIndex(null);
    try {
      const pdfjsLib = await getPdfjs();
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      if (generationRef.current !== gen) return;
      setPageCount(pdf.numPages);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const targetW = 160;
      const thumbScale = targetW / viewport.width;
      const scaled = page.getViewport({ scale: thumbScale });
      const canvas = document.createElement("canvas");
      canvas.width = scaled.width;
      canvas.height = scaled.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs-dist v5 render() requires canvas prop not in type defs
      await page.render({ canvasContext: ctx, viewport: scaled, canvas } as any).promise;
      if (generationRef.current !== gen) return;
      setThumbnail(canvas.toDataURL("image/png"));
    } catch (e) {
      console.warn("Failed to read PDF preview:", e);
    }
  }

  function handleRemoveFile() {
    generationRef.current++;
    setFile(null);
    setPageCount(null);
    setThumbnail(null);
    setResults([]);
    setError("");
    setProgress({ current: 0, total: 0 });
    setPreviewIndex(null);
  }

  function onReplacePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void handleFile([f]);
  }

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
      {!file && <FileDropzone accept="application/pdf" onFiles={handleFile} />}

      {file && (
        <>
          {/* File info card */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL preview, optimization not applicable
                <img src={thumbnail} alt={file.name} className="h-full w-full object-contain" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {pageCount !== null && <>{pageCount} {t("pages")} · </>}
                {formatFileSize(file.size)}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={converting}
                onClick={() => replaceInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {tc("replaceFile")}
              </button>
              <button
                type="button"
                disabled={converting}
                onClick={handleRemoveFile}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={replaceInputRef}
              type="file"
              accept="application/pdf"
              onChange={onReplacePicked}
              className="hidden"
            />
          </div>

          {/* Output format */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <label className="text-sm font-medium">{t("format")}</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={format === "png" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFormat("png")}
              >
                PNG
              </Button>
              <Button
                variant={format === "jpeg" ? "primary" : "outline"}
                size="sm"
                onClick={() => setFormat("jpeg")}
              >
                JPG
              </Button>
            </div>
          </div>

          {/* Scale + quality */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium">
                <span>{t("scale")}</span>
                <span className="tabular-nums text-muted-foreground">{scale}x</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {format === "jpeg" && (
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-medium">
                  <span>{t("quality")}</span>
                  <span className="tabular-nums text-muted-foreground">{quality}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>

          {/* Convert button + progress */}
          <div className="space-y-3">
            <Button
              onClick={handleConvert}
              disabled={converting}
              className="w-full sm:w-auto"
            >
              {converting
                ? `${t("converting")} (${progress.current}/${progress.total})`
                : t("convert")}
            </Button>
            {converting && progress.total > 0 && (
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        </>
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
                  <img src={getUrl(page.blob)} alt={page.filename} className="w-full" />
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

      {previewIndex !== null && results[previewIndex] && (
        <ImageLightbox
          src={getUrl(results[previewIndex].blob)}
          alt={results[previewIndex].filename}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
}
