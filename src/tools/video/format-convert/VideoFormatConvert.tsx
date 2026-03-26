"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
import { convertVideoFormat, FORMATS, type VideoFormat } from "./logic";

export default function VideoFormatConvert() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<VideoFormat>("mp4");
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.video.format-convert");
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg();

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleConvert() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    setProgress(0);
    const ff = await loadFFmpeg();
    if (!ff) { setProcessing(false); return; }
    try {
      const output = await convertVideoFormat(file, format, setProgress);
      setResult(output);
    } catch (e) {
      console.error("Convert failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <VideoUploader
        file={file}
        onFileChange={(f) => {
          setFile(f);
          setResult(null);
          setError("");
        }}
      />

      {ffmpegStatus === "loading" && <FFmpegLoadingState />}

      {ffmpegStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {tc("ffmpegLoadError")}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("format")}</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
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
            <Button onClick={handleConvert} disabled={processing}>
              {processing
                ? `${t("converting")} ${progress}%`
                : t("convert")}
            </Button>
            {result && (
              <DownloadButton
                data={result.blob}
                filename={result.filename}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
