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
import { removeExif } from "./logic";

export default function RemoveExif() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.remove-exif");

  async function handleProcess() {
    if (files.length === 0) return;
    setProcessing(true);
    setResults([]);
    setProgress({ done: 0, total: files.length });
    setError("");

    for (const file of files) {
      try {
        const r = await removeExif(file);
        const item: ImageResultItem = {
          blob: r.cleaned,
          filename: r.outputFilename,
        };
        setResults((prev) => [...prev, item]);
      } catch (e) {
        console.error(`EXIF removal failed for ${file.name}:`, e);
        setError((prev) =>
          prev
            ? `${prev}\n${file.name}: ${e instanceof Error ? e.message : String(e)}`
            : `${file.name}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={setFiles}
        disabled={processing}
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleProcess}
          disabled={files.length === 0 || processing}
        >
          {processing ? t("processing") : t("removeExif")}
        </Button>
        {processing && (
          <span className="text-sm text-muted-foreground">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </pre>
      )}

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
