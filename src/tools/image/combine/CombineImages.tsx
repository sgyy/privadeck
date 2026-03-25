"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { combineImages, type CombineLayout } from "./logic";

export default function CombineImages() {
  const [files, setFiles] = useState<File[]>([]);
  const [layout, setLayout] = useState<CombineLayout>("horizontal");
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.combine");

  function handleFilesChange(newFiles: File[]) {
    setFiles(newFiles);
    setResults([]);
    setError("");
  }

  async function handleCombine() {
    if (files.length < 2) return;
    setProcessing(true);
    setError("");
    setResults([]);
    try {
      const blob = await combineImages(files, layout);
      setResults((prev) => [...prev, { blob, filename: "combined.png" }]);
    } catch (e) {
      console.error("Combine failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={handleFilesChange}
        disabled={processing}
      />

      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={layout === "horizontal" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLayout("horizontal")}
            >
              {t("horizontal")}
            </Button>
            <Button
              variant={layout === "vertical" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLayout("vertical")}
            >
              {t("vertical")}
            </Button>
          </div>

          <Button
            onClick={handleCombine}
            disabled={files.length < 2 || processing}
          >
            {processing ? t("processing") : t("combine")}
          </Button>
        </div>
      )}

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
