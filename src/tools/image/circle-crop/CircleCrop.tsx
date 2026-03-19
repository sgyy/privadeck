"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { circleCrop } from "./logic";

export default function CircleCrop() {
  const t = useTranslations("tools.image.circle-crop");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultUrl = useObjectUrl(result);

  async function handleProcess() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await circleCrop(file);
      setResult(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
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
          setResult(null);
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

      {result && resultUrl && (
        <div className="space-y-3">
          <img
            src={resultUrl}
            alt="Result"
            className="max-h-96 rounded-lg"
          />
          <DownloadButton
            data={result}
            filename={`circle-${file?.name?.replace(/\.[^.]+$/, "") || "image"}.png`}
          />
        </div>
      )}
    </div>
  );
}
