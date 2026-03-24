"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { ShieldCheck } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={setFiles}
        disabled={processing}
      />

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
