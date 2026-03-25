"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import { grayscaleImage } from "./logic";

const tracker = createToolTracker("grayscale", "image");

export default function Grayscale() {
  const t = useTranslations("tools.image.grayscale");
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
      const blob = await grayscaleImage(file);
      tracker.trackProcessComplete(Date.now() - start);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const rawExt = blob.type.split("/")[1] || "png";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      setResults((prev) => [...prev, { blob, filename: `grayscale-${baseName}.${ext}` }]);
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
      <SingleImageUpload
        file={file}
        onFileChange={(f) => { setFile(f); setResults([]); setError(null); }}
        accept="image/*"
      />

      <Button onClick={handleProcess} disabled={!file || processing}>
        {processing ? t("processing") : t("convert")}
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
