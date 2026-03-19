"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export interface ImageResultItem {
  blob: Blob;
  filename: string;
  meta?: string;
}

interface ImageResultListProps {
  results: ImageResultItem[];
  onRemove: (index: number) => void;
}

export function ImageResultList({ results, onRemove }: ImageResultListProps) {
  const t = useTranslations("common");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const urlMapRef = useRef<Map<Blob, string>>(new Map());

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

  function handleDownload(item: ImageResultItem) {
    const url = getUrl(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.filename;
    a.click();
  }

  function handleRemove(index: number) {
    if (previewIndex === index) setPreviewIndex(null);
    else if (previewIndex !== null && previewIndex > index) {
      setPreviewIndex(previewIndex - 1);
    }
    onRemove(index);
  }

  if (results.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {results.map((item, i) => (
          <div
            key={`${item.filename}-${i}`}
            className="group relative overflow-hidden rounded-lg border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => setPreviewIndex(i)}
              className="block w-full cursor-zoom-in"
            >
              <img
                src={getUrl(item.blob)}
                alt={item.filename}
                className="aspect-square w-full object-cover"
              />
            </button>

            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="p-2">
              <p className="truncate text-xs font-medium">{item.filename}</p>
              {item.meta && (
                <p className="truncate text-xs text-muted-foreground">
                  {item.meta}
                </p>
              )}
              <div className="mt-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDownload(item)}
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("download")}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
            alt={results[previewIndex].filename}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
