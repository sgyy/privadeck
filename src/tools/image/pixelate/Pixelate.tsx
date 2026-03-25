"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import { pixelateImage } from "./logic";

const tracker = createToolTracker("pixelate", "image");

export default function Pixelate() {
  const t = useTranslations("tools.image.pixelate");
  const [file, setFile] = useState<File | null>(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResults([]);
    const start = Date.now();
    try {
      const blob = await pixelateImage(file, pixelSize);
      tracker.trackProcessComplete(Date.now() - start);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const rawExt = blob.type.split("/")[1] || "png";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      setResults((prev) => [...prev, { blob, filename: `pixelated-${baseName}.${ext}` }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed";
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/*"
        onFiles={(files) => {
          setFile(files[0]);
          setResults([]);
          setError(null);
        }}
      />

      {file && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          {file.name}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("pixelSize")}: {pixelSize}px
        </label>
        <input
          type="range"
          min={2}
          max={50}
          value={pixelSize}
          onChange={(e) => setPixelSize(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>2px</span>
          <span>50px</span>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={!file || processing}>
        {processing ? t("processing") : t("pixelate")}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <ImageResultList
          results={results}
          onRemove={(i) => setResults((prev) => prev.filter((_, idx) => idx !== i))}
        />
      )}
    </div>
  );
}
