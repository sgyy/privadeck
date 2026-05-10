"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { brandFilename } from "@/lib/brand";

export interface ImageResultItem {
  blob: Blob;
  filename: string;
  meta?: string;
}

interface ImageResultListProps {
  results: ImageResultItem[];
  onRemove: (index: number) => void;
}

// useLayoutEffect on the client, useEffect on the server (avoids the SSR
// warning while still syncing before paint when running in the browser).
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ImageResultList({ results, onRemove }: ImageResultListProps) {
  const t = useTranslations("common");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Persistent blob→URL cache. Incremental updates: new blobs get a new URL,
  // removed blobs get their URL revoked, blobs that are still present keep
  // their existing URL. This matters for streaming/append-style result
  // updates — recomputing all URLs on every change would invalidate already-
  // rendered <img> tags. The map lives in a ref; an effect publishes a copy
  // into state so render can read it without violating react-hooks/refs.
  const cacheRef = useRef<Map<Blob, string>>(new Map());
  const [urlMap, setUrlMap] = useState<ReadonlyMap<Blob, string>>(() => new Map());

  useIsoLayoutEffect(() => {
    const cache = cacheRef.current;
    const currentBlobs = new Set(results.map((r) => r.blob));
    let changed = false;
    for (const [blob, url] of [...cache]) {
      if (!currentBlobs.has(blob)) {
        URL.revokeObjectURL(url);
        cache.delete(blob);
        changed = true;
      }
    }
    for (const r of results) {
      if (!cache.has(r.blob)) {
        cache.set(r.blob, URL.createObjectURL(r.blob));
        changed = true;
      }
    }
    if (changed) setUrlMap(new Map(cache));
  }, [results]);

  // Revoke any remaining URLs on unmount.
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, []);

  function getUrl(blob: Blob): string {
    return urlMap.get(blob) ?? "";
  }

  function handleDownload(item: ImageResultItem) {
    const url = getUrl(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = brandFilename(item.filename);
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getUrl(item.blob)}
                alt={item.filename}
                className="aspect-square w-full object-cover"
                loading="lazy"
                decoding="async"
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

      {previewIndex !== null && results[previewIndex] && (
        <ImageLightbox
          src={getUrl(results[previewIndex].blob)}
          alt={results[previewIndex].filename}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </>
  );
}
