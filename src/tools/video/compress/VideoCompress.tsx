"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { compressVideo, type Quality } from "./logic";

const QUALITIES: Quality[] = ["high", "medium", "low"];

export default function VideoCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileUrl = useObjectUrl(file);
  const t = useTranslations("tools.video.compress");

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleCompress() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    setProgress(0);
    try {
      const blob = await compressVideo(file, quality, setProgress);
      setResult(blob);
    } catch (e) {
      console.error("Compress failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="video/*"
        onFiles={(f) => {
          setFile(f[0]);
          setResult(null);
          setError("");
        }}
      />

      {file && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            {file.name} ({formatSize(file.size)})
          </div>

          {fileUrl && (
            <video
              src={fileUrl}
              controls
              className="max-h-[300px] w-full rounded-lg"
            />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("quality")}</label>
            <div className="flex gap-2">
              {QUALITIES.map((q) => (
                <Button
                  key={q}
                  variant={quality === q ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setQuality(q)}
                >
                  {t(q)}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={handleCompress} disabled={processing}>
              {processing
                ? `${t("processing")} ${progress}%`
                : t("compress")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={`compressed_${file.name.replace(/\.[^.]+$/, "")}.mp4`}
              />
            )}
          </div>

          {result && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>{t("originalSize")}</span>
                <span className="font-mono">{formatSize(file.size)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("compressedSize")}</span>
                <span className="font-mono">{formatSize(result.size)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t("saved")}</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  {Math.round((1 - result.size / file.size) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
