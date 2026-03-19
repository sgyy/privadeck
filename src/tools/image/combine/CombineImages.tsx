"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { combineImages, type CombineLayout } from "./logic";

export default function CombineImages() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<CombineLayout>("horizontal");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const previewUrlsRef = useRef<string[]>([]);
  const t = useTranslations("tools.image.combine");

  const resultUrl = useObjectUrl(result);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function handleFiles(newFiles: File[]) {
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => {
      const updated = [...prev, ...newUrls];
      previewUrlsRef.current = updated;
      return updated;
    });
    setResult(null);
    setError("");
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      previewUrlsRef.current = updated;
      return updated;
    });
    setResult(null);
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
      <FileDropzone accept="image/*" multiple onFiles={handleFiles} />

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-border"
            >
              <img
                src={previewUrls[i]}
                alt={file.name}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="truncate px-1 py-0.5 text-xs">{file.name}</p>
            </div>
          ))}
        </div>
      )}

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
