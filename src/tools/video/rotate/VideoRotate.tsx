"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { RotateCw } from "lucide-react";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { rotateVideo, type RotateAngle } from "./logic";

export default function VideoRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<RotateAngle>(90);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.rotate");
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg();

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleRotate() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    await loadFFmpeg();
    try {
      const blob = await rotateVideo(file, angle, setProgress);
      setResult(blob);
    } catch (e) {
      console.error("Rotate failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="video/*"
        onFiles={(f) => { setFile(f[0]); setResult(null); setError(""); }}
      />

      {ffmpegStatus === "loading" && <FFmpegLoadingState />}

      {ffmpegStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {tc("ffmpegLoadError")}
        </div>
      )}

      {file && fileUrl && (
        <div className="space-y-3">
          <video src={fileUrl} controls className="max-h-[300px] w-full rounded-lg" />

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              {([90, 180, 270] as RotateAngle[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngle(a)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    angle === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <RotateCw className="h-4 w-4" style={{ transform: `rotate(${a}deg)` }} />
                  {a}°
                </button>
              ))}
            </div>

            <Button onClick={handleRotate} disabled={processing}>
              {processing ? `${t("processing")} ${progress}%` : t("rotate")}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {result && resultUrl && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <video src={resultUrl} controls className="max-h-[200px] flex-1 rounded" />
              <DownloadButton data={result} filename={`rotated_${angle}_${file.name}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
