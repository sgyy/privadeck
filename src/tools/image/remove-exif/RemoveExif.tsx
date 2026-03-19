"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { X, ShieldCheck } from "lucide-react";
import { removeExif, formatFileSize } from "./logic";

export default function RemoveExif() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const t = useTranslations("tools.image.remove-exif");

  async function handleProcess() {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const cleaned = await Promise.all(files.map(removeExif));
      const newItems: ImageResultItem[] = cleaned.map((r) => ({
        blob: r.cleaned,
        filename: r.outputFilename,
        meta: `${formatFileSize(r.originalSize)} → ${formatFileSize(r.cleanedSize)}`,
      }));
      setResults((prev) => [...newItems, ...prev]);
    } catch (e) {
      console.error("EXIF removal failed:", e);
    } finally {
      setProcessing(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/*"
        multiple
        onFiles={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleProcess}
        disabled={files.length === 0 || processing}
      >
        {processing ? t("processing") : t("removeExif")}
      </Button>

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <ShieldCheck className="h-4 w-4" />
            {t("cleaned")}
          </div>
          <ImageResultList
            results={results}
            onRemove={(i) =>
              setResults((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </div>
      )}
    </div>
  );
}
