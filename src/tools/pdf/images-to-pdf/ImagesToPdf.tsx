"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { X, GripVertical } from "lucide-react";
import { createToolTracker } from "@/lib/analytics";
import { imagesToPdf, formatFileSize } from "./logic";

const tracker = createToolTracker("images-to-pdf", "pdf");

export default function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.images-to-pdf");
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  // Revoke all preview URLs on unmount
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setResult(null);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setResult(null);
  }

  async function handleConvert() {
    if (files.length === 0) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const t0 = performance.now();
    try {
      const blob = await imagesToPdf(files);
      setResult(blob);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Conversion failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
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
        multiple
        onFiles={handleFiles}
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="relative flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[i]}
                alt={file.name}
                className="h-24 w-20 rounded object-cover"
              />
              <span className="max-w-[80px] truncate text-xs text-muted-foreground">
                {file.name}
              </span>
              <div className="flex items-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveFile(i, i - 1)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </button>
                )}
                {i < files.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveFile(i, i + 1)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <GripVertical className="h-3 w-3 -rotate-90" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={handleConvert}
          disabled={files.length === 0 || processing}
        >
          {processing ? t("converting") : t("convert")}
        </Button>
        {result && (
          <DownloadButton data={result} filename="images.pdf" />
        )}
      </div>

      {result && (
        <p className="text-sm text-muted-foreground">
          {t("resultSize")}: {formatFileSize(result.size)}
        </p>
      )}
    </div>
  );
}
