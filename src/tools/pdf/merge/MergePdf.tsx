"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { X, GripVertical } from "lucide-react";
import { mergePdfs, formatFileSize } from "./logic";

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.merge");

  async function handleMerge() {
    if (files.length < 2) return;
    setMerging(true);
    setResult(null);
    setError("");
    try {
      const blob = await mergePdfs(files);
      setResult(blob);
    } catch (e) {
      console.error("Merge failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setMerging(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="application/pdf"
        multiple
        onFiles={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <div className="flex flex-col gap-0.5">
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
              </div>
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
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
          onClick={handleMerge}
          disabled={files.length < 2 || merging}
        >
          {merging ? t("merging") : t("merge")}
        </Button>
        {result && (
          <DownloadButton data={result} filename="merged.pdf" />
        )}
      </div>

      {result && (
        <p className="text-sm text-muted-foreground">
          {t("mergedSize")}: {formatFileSize(result.size)}
        </p>
      )}
    </div>
  );
}
