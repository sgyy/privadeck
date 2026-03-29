"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { RotateCw } from "lucide-react";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { isWebCodecsSupported, shouldSuggestHevcExtension, UnsupportedVideoCodecError } from "@/lib/media-pipeline";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { rotateVideo, type RotateAngle } from "./logic";

export default function VideoRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<RotateAngle>(90);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isCodecError, setIsCodecError] = useState(false);
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.video.rotate");
  const tc = useTranslations("common");

  if (!isSharedArrayBufferSupported() && !isWebCodecsSupported()) {
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
    setIsCodecError(false);
    try {
      const blob = await rotateVideo(file, angle, setProgress);
      setResult(blob);
    } catch (e) {
      console.error("Rotate failed:", e);
      if (e instanceof UnsupportedVideoCodecError) {
        setIsCodecError(true);
        setError(tc("unsupportedVideoCodec"));
      } else {
        setError(String(e instanceof Error ? e.message : e));
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <VideoUploader
        file={file}
        onFileChange={(f) => { setFile(f); setResult(null); setError(""); setIsCodecError(false); }}
      />

      {file && (
        <div className="space-y-3">
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
            <div className={`rounded-lg border p-3 text-sm ${isCodecError
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
              }`}>
              {error}
              {isCodecError && shouldSuggestHevcExtension() && (
                <p className="mt-1 text-xs opacity-80">{tc("hevcInstallHint")}</p>
              )}
            </div>
          )}

          {processing && <ProcessingProgress progress={progress} />}

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
                <DownloadButton data={result} filename={`rotated_${angle}_${file.name}`} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
