"use client";

import { useEffect, useRef, useState } from "react";
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

export function ImageResultList({ results, onRemove }: ImageResultListProps) {
  const t = useTranslations("common");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const urlCacheRef = useRef(new Map<Blob, string>());

  // Sync the cache during render rather than in useMemo. React StrictMode
  // double-mounts components in dev: it mounts → runs effect cleanup → mounts
  // again. If we cached URLs through useMemo, the simulated unmount cleanup
  // would revoke the URLs while useMemo's memoized result kept handing the now-
  // dead URLs to <img>. Reading and mutating the ref directly during render
  // means the second mount re-syncs the cache from scratch and the JSX always
  // sees a freshly-created URL. The cache.has() check keeps it idempotent under
  // StrictMode's intentional double render.
  const cache = urlCacheRef.current;
  const currentBlobs = new Set(results.map((r) => r.blob));
  for (const [blob, url] of cache) {
    if (!currentBlobs.has(blob)) {
      URL.revokeObjectURL(url);
      cache.delete(blob);
    }
  }
  for (const r of results) {
    if (!cache.has(r.blob)) {
      cache.set(r.blob, URL.createObjectURL(r.blob));
    }
  }

  // Free every URL on real unmount. StrictMode's simulated unmount also runs
  // this — but the next render rebuilds the cache from scratch (above), so the
  // <img> tags always end up with valid URLs.
  useEffect(() => {
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cache is a stable ref
  }, []);

  function getUrl(blob: Blob): string {
    return cache.get(blob) ?? "";
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
