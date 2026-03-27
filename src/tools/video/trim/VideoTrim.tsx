"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
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
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.trim");

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
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
      <VideoUploader
        file={file}
        onFileChange={(f) => {
          setFile(f);
          setResult(null);
          setStart(0);
          setEnd(0);
          setError("");
        }}
        onMetadataLoaded={(meta) => {
          setDuration(meta.duration);
          setEnd(meta.duration);
        }}
      />

      {file && (
        <div className="space-y-3">
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

          {processing && <ProcessingProgress progress={progress} />}

          <Button onClick={handleTrim} disabled={processing}>
            {processing ? `${t("processing")} ${progress}%` : t("trim")}
          </Button>

          {result && resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="bg-black/5 dark:bg-black/20">
                  <video src={resultUrl} controls className="mx-auto max-h-[400px] w-full" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{formatSize(file.size)}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-medium">{formatSize(result.size)}</span>
                  {(() => {
                    const pct = Math.round((1 - result.size / file.size) * 100);
                    const isSmaller = pct > 0;
                    return (
                      <span className={`font-medium ${isSmaller ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                        ({isSmaller ? `-${pct}%` : `+${Math.abs(pct)}%`})
                      </span>
                    );
                  })()}
                </div>
                <DownloadButton data={result} filename={`trimmed_${file.name}`} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
