"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import { flipImage } from "./logic";

const tracker = createToolTracker("flip", "image");

export default function Flip() {
  const t = useTranslations("tools.image.flip");
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "horizontal"
  );
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
      const blob = await flipImage(file, direction);
      tracker.trackProcessComplete(Date.now() - start);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const rawExt = blob.type.split("/")[1] || "png";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      setResults((prev) => [...prev, { blob, filename: `flipped-${baseName}.${ext}` }]);
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

      <div className="flex gap-2">
        <Button
          variant={direction === "horizontal" ? "primary" : "outline"}
          onClick={() => setDirection("horizontal")}
        >
          {t("horizontal")}
        </Button>
        <Button
          variant={direction === "vertical" ? "primary" : "outline"}
          onClick={() => setDirection("vertical")}
        >
          {t("vertical")}
        </Button>
      </div>

      <Button onClick={handleProcess} disabled={!file || processing}>
        {processing ? t("processing") : t("flipImage")}
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
