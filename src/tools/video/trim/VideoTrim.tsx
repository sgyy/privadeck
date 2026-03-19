"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { trimVideo, formatTimeDisplay } from "./logic";

export default function VideoTrim() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileUrl = useObjectUrl(file);
  const t = useTranslations("tools.video.trim");

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setStart(0);
    setError("");
  }

  function handleLoadedMetadata() {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEnd(dur);
    }
  }

  async function handleTrim() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await trimVideo(file, start, end, setProgress);
      setResult(blob);
    } catch (e) {
      console.error("Trim failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="video/*" onFiles={handleFile} />

      {file && fileUrl && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            src={fileUrl}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            className="max-h-[300px] w-full rounded-lg"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <span>{t("start")}: {formatTimeDisplay(start)}</span>
              <span>{t("end")}: {formatTimeDisplay(end)}</span>
              <span className="text-muted-foreground">
                {t("duration")}: {formatTimeDisplay(end - start)}
              </span>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t("start")}
                </label>
                <input
                  type="range" min={0} max={duration} step={0.1} value={start}
                  onChange={(e) => setStart(Math.min(Number(e.target.value), end - 0.1))}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t("end")}
                </label>
                <input
                  type="range" min={0} max={duration} step={0.1} value={end}
                  onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 0.1))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={handleTrim} disabled={processing}>
              {processing ? `${t("processing")} ${progress}%` : t("trim")}
            </Button>
            {result && (
              <DownloadButton data={result} filename={`trimmed_${file.name}`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
