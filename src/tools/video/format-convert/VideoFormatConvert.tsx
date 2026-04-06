"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { VideoUploader, formatSize } from "@/components/shared/VideoUploader";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { isWebCodecsSupported, shouldSuggestHevcExtension, UnsupportedVideoCodecError, canEncodeHevc, type VideoCodec } from "@/lib/media-pipeline";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { convertVideoFormat, FORMATS, type VideoFormat } from "./logic";

export default function VideoFormatConvert() {
  const isClient = useIsClient();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<VideoFormat>("mp4");
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isCodecError, setIsCodecError] = useState(false);

  // Codec selection state
  const [outputCodec, setOutputCodec] = useState<VideoCodec>("avc");
  const [canUseHevc, setCanUseHevc] = useState(false);
  const [checkingHevcSupport, setCheckingHevcSupport] = useState(false);
  // Track source codec as state for proper reactivity
  const [sourceCodec, setSourceCodec] = useState<VideoCodec | undefined>(undefined);

  const resultUrl = useObjectUrl(result?.blob ?? null);
  const t = useTranslations("tools.video.format-convert");
  const tc = useTranslations("common");

  // Check H.265 encoding support when component mounts
  useEffect(() => {
    if (!isWebCodecsSupported()) return;
    setCheckingHevcSupport(true);
    canEncodeHevc().then((supported) => {
      setCanUseHevc(supported);
      setCheckingHevcSupport(false);
    });
  }, []);

  // Set default output codec based on source video codec
  useEffect(() => {
    if (!sourceCodec) return;
    if (sourceCodec === "hevc" && canUseHevc) {
      setOutputCodec("hevc");
    } else {
      setOutputCodec("avc");
    }
  }, [sourceCodec, canUseHevc]);

  if (!isClient) {
    return null;
  }

  if (!isSharedArrayBufferSupported() && !isWebCodecsSupported()) {
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
    setIsCodecError(false);
    setProgress(0);
    try {
      // Pass both output codec and source codec for smart stream copy detection
      const options = {
        codec: outputCodec,
        sourceCodec: sourceCodec,
      };
      const output = await convertVideoFormat(file, format, setProgress, options);
      setResult(output);
    } catch (e) {
      console.error("Convert failed:", e);
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
        onFileChange={(f) => {
          setFile(f);
          setResult(null);
          setError("");
          setIsCodecError(false);
          setSourceCodec(undefined);
        }}
        onMetadataLoaded={(meta) => {
          setSourceCodec(meta.codec);
        }}
        onCodecWarning={(warning) => setIsCodecError(warning?.isUnsupported ?? false)}
      />

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

          {/* Video codec selection for all formats */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("codecLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={outputCodec === "avc" ? "primary" : "outline"}
                size="sm"
                onClick={() => setOutputCodec("avc")}
              >
                H.264 (AVC)
              </Button>
              <Button
                variant={outputCodec === "hevc" ? "primary" : "outline"}
                size="sm"
                disabled={!canUseHevc}
                onClick={() => setOutputCodec("hevc")}
              >
                H.265 (HEVC)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {canUseHevc
                ? t("codecHint")
                : checkingHevcSupport
                  ? t("codecChecking")
                  : t("codecHevcNotSupported")}
            </p>
          </div>

          {/* Info for MKV format: stream copy or transcode */}
          {format === "mkv" && sourceCodec === outputCodec && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400">
              {t("mkvStreamCopy")}
            </div>
          )}

          {/* Warning for MKV: transcoding required when codec differs */}
          {format === "mkv" && sourceCodec && sourceCodec !== outputCodec && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
              {t("mkvTranscode")}
            </div>
          )}

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

          <Button onClick={handleConvert} disabled={processing || isCodecError}>
            {processing
              ? `${t("converting")} ${progress}%`
              : t("convert")}
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
                  <span className="font-medium">{formatSize(result.blob.size)}</span>
                  {(() => {
                    const pct = Math.round((1 - result.blob.size / file.size) * 100);
                    const isSmaller = pct > 0;
                    return (
                      <span className={`font-medium ${isSmaller ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                        ({isSmaller ? `-${pct}%` : `+${Math.abs(pct)}%`})
                      </span>
                    );
                  })()}
                </div>
                <DownloadButton data={result.blob} filename={result.filename} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
