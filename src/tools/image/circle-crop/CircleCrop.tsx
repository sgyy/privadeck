"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import { circleCrop } from "./logic";

const tracker = createToolTracker("circle-crop", "image");

export default function CircleCrop() {
  const t = useTranslations("tools.image.circle-crop");
  const [file, setFile] = useState<File | null>(null);
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
      const blob = await circleCrop(file);
      tracker.trackProcessComplete(Date.now() - start);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      setResults((prev) => [...prev, { blob, filename: `circle-${baseName}.png` }]);
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

      <Button onClick={handleProcess} disabled={!file || processing}>
        {processing ? t("processing") : t("cropCircle")}
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
