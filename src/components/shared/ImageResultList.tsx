"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

  // Sync URL cache with current results: create URLs for new blobs, revoke stale ones
  /* eslint-disable react-hooks/refs -- intentional: persistent URL cache across renders */
  const urlEntries = useMemo(() => {
    const cache = urlCacheRef.current;
    const currentBlobs = new Set(results.map((r) => r.blob));

    // Revoke URLs for blobs no longer in results
    for (const [blob, url] of cache) {
      if (!currentBlobs.has(blob)) {
        URL.revokeObjectURL(url);
        cache.delete(blob);
      }
    }

    // Build entries, creating URLs for new blobs
    return results.map((r) => {
      let url = cache.get(r.blob);
      if (!url) {
        url = URL.createObjectURL(r.blob);
        cache.set(r.blob, url);
      }
      return { blob: r.blob, url };
    });
  }, [results]);
  /* eslint-enable react-hooks/refs */

  // Cleanup all URLs on unmount
  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, []);

  // Derive a Blob→URL lookup from state (pure computation, no ref access)
  const urlMap = useMemo(
    () => new Map(urlEntries.map((e) => [e.blob, e.url])),
    [urlEntries],
  );

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
