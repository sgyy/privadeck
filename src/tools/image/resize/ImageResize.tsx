"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Link2, Link2Off } from "lucide-react";
import { createToolTracker } from "@/lib/analytics";
import { resizeImage, getImageDimensions, fitDimensions, PRESETS } from "./logic";

const tracker = createToolTracker("resize", "image");

export default function ImageResize() {
  const [file, setFile] = useState<File | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [resizing, setResizing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.resize");
  const fileRef = useRef<File | null>(null);

  async function handleFileChange(f: File | null) {
    fileRef.current = f;
    setFile(f);
    setResults([]);
    setError("");
    setOriginalWidth(0);
    setOriginalHeight(0);
    setWidth(0);
    setHeight(0);
    if (!f) return;
    const dims = await getImageDimensions(f);
    if (fileRef.current !== f) return;
    setOriginalWidth(dims.width);
    setOriginalHeight(dims.height);
    setWidth(dims.width);
    setHeight(dims.height);
  }

  function handleWidth(w: number) {
    setWidth(w);
    if (lockRatio && originalWidth > 0) {
      setHeight(Math.round((w / originalWidth) * originalHeight));
    }
  }

  function handleHeight(h: number) {
    setHeight(h);
    if (lockRatio && originalHeight > 0) {
      setWidth(Math.round((h / originalHeight) * originalWidth));
    }
  }

  function applyPreset(pw: number, ph: number) {
    // Fit within preset dimensions while keeping aspect ratio
    if (originalWidth > 0 && originalHeight > 0) {
      const fitted = fitDimensions(originalWidth, originalHeight, pw, ph);
      setWidth(fitted.width);
      setHeight(fitted.height);
      setLockRatio(true);
    } else {
      setWidth(pw);
      setHeight(ph);
    }
  }

  async function handleResize() {
    if (!file || width <= 0 || height <= 0) return;
    setResizing(true);
    setError("");
    const t0 = performance.now();
    try {
      const blob = await resizeImage(file, { width, height });
      setResults((prev) => [
        { blob, filename: `resized_${file.name}`, meta: `${width}×${height}` },
        ...prev,
      ]);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Resize failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      setResizing(false);
    }
  }

  return (
    <div className="space-y-4">
      <SingleImageUpload
        file={file}
        onFileChange={handleFileChange}
        accept="image/*"
      />

      {file && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("width")}
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => handleWidth(Number(e.target.value))}
                min={1}
                className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => setLockRatio(!lockRatio)}
              className="mb-2 text-muted-foreground hover:text-foreground"
              title={lockRatio ? t("unlock") : t("lock")}
            >
              {lockRatio ? (
                <Link2 className="h-5 w-5" />
              ) : (
                <Link2Off className="h-5 w-5" />
              )}
            </button>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("height")}
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => handleHeight(Number(e.target.value))}
                min={1}
                className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button onClick={handleResize} disabled={resizing}>
              {resizing ? t("resizing") : t("resize")}
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t("presets")}</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.width, p.height)}
                  className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <ImageResultList
              results={results}
              onRemove={(i) =>
                setResults((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          )}
        </>
      )}
    </div>
  );
}
