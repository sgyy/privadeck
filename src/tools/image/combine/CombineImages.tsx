"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { combineImages, type CombineLayout } from "./logic";

export default function CombineImages() {
  const [files, setFiles] = useState<File[]>([]);
  const [layout, setLayout] = useState<CombineLayout>("horizontal");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.combine");

  const resultUrl = useObjectUrl(result);

  function handleFilesChange(newFiles: File[]) {
    setFiles(newFiles);
    setResult(null);
    setError("");
  }

  async function handleCombine() {
    if (files.length < 2) return;
    setProcessing(true);
    setError("");
    try {
      const blob = await combineImages(files, layout);
      setResult(blob);
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

      {result && resultUrl && (
        <div className="space-y-3">
          <img
            src={resultUrl}
            alt="Result"
            className="max-h-96 rounded-lg"
          />
          <DownloadButton data={result} filename="combined.png" />
        </div>
      )}
    </div>
  );
}
