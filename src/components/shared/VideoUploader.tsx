"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw, Film, Clock, Maximize2, Gauge, MonitorPlay, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/Button";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { isWebCodecsSupported, shouldSuggestHevcExtension, detectSourceVideoCodec, type VideoCodec } from "@/lib/media-pipeline";

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  estimatedBitrate: number;
  fileSize: number;
  fps?: number;
  /** Source video codec: "avc" (H.264) or "hevc" (H.265) */
  codec?: VideoCodec;
}

export interface CodecWarning {
  isUnsupported: boolean;
  suggestHevcExtension: boolean;
}

interface VideoUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onMetadataLoaded?: (metadata: VideoMetadata) => void;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
  onCodecWarning?: (warning: CodecWarning | null) => void;
  /** If true, check WebCodecs compatibility when video loads */
  checkCodecSupport?: boolean;
  maxSize?: number;
  className?: string;
  analyticsSlug?: string;
  analyticsCategory?: string;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function calcEstimatedBitrate(fileSizeBytes: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.round((fileSizeBytes * 8) / durationSec / 1000);
}

function formatBitrate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${kbps} kbps`;
}

export function VideoUploader({
  file,
  onFileChange,
  onMetadataLoaded,
  onVideoRef,
  onCodecWarning,
  checkCodecSupport = true,
  maxSize,
  className,
  analyticsSlug,
  analyticsCategory,
}: VideoUploaderProps) {
  const t = useTranslations("common");
  const fileUrl = useObjectUrl(file);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [codecWarning, setCodecWarning] = useState<CodecWarning | null>(null);
  const fpsDetectId = useRef(0);
  const codecCheckId = useRef(0);
  const prevFileRef = useRef<File | null>(null);

  const handleVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
      onVideoRef?.(el);
    },
    [onVideoRef],
  );

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v || !file) return;
    const meta: VideoMetadata = {
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
      estimatedBitrate: calcEstimatedBitrate(file.size, v.duration),
      fileSize: file.size,
    };
    setMetadata(meta);
    onMetadataLoaded?.(meta);
    detectFps(v, meta);

    // Check codec support for WebCodecs
    if (checkCodecSupport && isWebCodecsSupported()) {
      checkVideoCodecSupport(file);
    }

    // Detect source video codec
    detectSourceVideoCodec(file).then((codec) => {
      if (codec && metadata) {
        const updated = { ...metadata, codec };
        setMetadata(updated);
        onMetadataLoaded?.(updated);
      }
    });
  }

  /**
   * Check if the video codec is supported by WebCodecs.
   * This uses mediabunny to probe the file and detect unsupported codecs.
   */
  async function checkVideoCodecSupport(videoFile: File) {
    const checkId = ++codecCheckId.current;

    try {
      const {
        Input,
        Output,
        Conversion,
        BlobSource,
        BufferTarget,
        Mp4OutputFormat,
        ALL_FORMATS,
      } = await import("mediabunny");

      // If a new file is selected, abort this check
      if (checkId !== codecCheckId.current) return;

      const input = new Input({
        source: new BlobSource(videoFile),
        formats: ALL_FORMATS,
      });

      const target = new BufferTarget();
      const output = new Output({
        format: new Mp4OutputFormat(),
        target,
      });

      // Try to initialize a conversion to check if the codec is supported
      const conversion = await Conversion.init({
        input,
        output,
        video: {
          codec: "avc",
          bitrate: 1_000_000, // Low bitrate, we won't actually encode
        },
        audio: {
          codec: "aac",
          bitrate: 128_000,
        },
        showWarnings: false,
      });

      // If a new file is selected, abort this check
      if (checkId !== codecCheckId.current) return;

      // Check if any tracks were discarded due to codec issues
      const codecReasons = new Set([
        "undecodable_source_codec",
        "unknown_source_codec",
        "no_encodable_target_codec",
      ]);

      const discardedCodecTracks = conversion.discardedTracks.filter((d) =>
        codecReasons.has(d.reason),
      );

      if (discardedCodecTracks.length > 0) {
        const hasVideoCodecIssue = discardedCodecTracks.some(
          (d) => d.track.type === "video" && d.reason === "undecodable_source_codec",
        );

        if (hasVideoCodecIssue) {
          const warning: CodecWarning = {
            isUnsupported: true,
            suggestHevcExtension: shouldSuggestHevcExtension(),
          };
          setCodecWarning(warning);
          onCodecWarning?.(warning);
          return;
        }
      }

      // No codec issues detected
      setCodecWarning(null);
      onCodecWarning?.(null);
    } catch (e) {
      // If the check fails for any reason, don't show a warning
      // The actual processing will handle the error
      console.warn("Codec check failed:", e);
    }
  }

  function detectFps(v: HTMLVideoElement, baseMeta: VideoMetadata) {
    if (!("requestVideoFrameCallback" in v)) return;
    const detectId = ++fpsDetectId.current;
    const savedTime = v.currentTime;
    const wasPaused = v.paused;
    const wasMuted = v.muted;
    let firstTime: number | null = null;

    v.muted = true;

    function onFrame(_now: DOMHighResTimeStamp, frameInfo: { mediaTime: number }) {
      if (detectId !== fpsDetectId.current) {
        v.pause();
        v.muted = wasMuted;
        v.currentTime = savedTime;
        if (!wasPaused) v.play().catch(() => { });
        return;
      }
      if (firstTime === null) {
        firstTime = frameInfo.mediaTime;
        v.requestVideoFrameCallback(onFrame);
        return;
      }
      const delta = frameInfo.mediaTime - firstTime;
      v.pause();
      v.currentTime = savedTime;
      v.muted = wasMuted;
      if (!wasPaused) v.play().catch(() => { });
      if (delta > 0) {
        const fps = Math.round(1 / delta);
        const updated = { ...baseMeta, fps };
        setMetadata(updated);
        onMetadataLoaded?.(updated);
      }
    }

    v.requestVideoFrameCallback(onFrame);
    v.play().catch(() => { /* autoplay may be blocked, fps stays undefined */ });
  }

  function handleChangeFile() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setMetadata(null);
      setCodecWarning(null);
      onCodecWarning?.(null);
      onFileChange(f);
    }
    // reset so same file can be re-selected
    e.target.value = "";
  }

  // Clear codec warning when file is cleared externally or changed to a different file
  useEffect(() => {
    if (!file) {
      // File was cleared
      if (codecWarning) {
        setCodecWarning(null);
        onCodecWarning?.(null);
      }
    } else if (prevFileRef.current && file !== prevFileRef.current) {
      // File changed to a different one - clear old warning before new detection
      setCodecWarning(null);
      onCodecWarning?.(null);
    }
    prevFileRef.current = file;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  if (!file) {
    return (
      <FileDropzone
        accept="video/*"
        onFiles={(files) => onFileChange(files[0] ?? null)}
        maxSize={maxSize}
        className={className}
        analyticsSlug={analyticsSlug}
        analyticsCategory={analyticsCategory}
      />
    );
  }

  return (
    <div className={className}>
      {/* Codec warning banner */}
      {codecWarning && codecWarning.isUnsupported && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>{t("unsupportedVideoCodec")}</p>
              {codecWarning.suggestHevcExtension && (
                <p className="text-xs opacity-80">{t("hevcInstallHint")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
        {/* Video preview */}
        {fileUrl && (
          <div className="bg-black/5 dark:bg-black/20">
            <video
              ref={handleVideoRef}
              src={fileUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="mx-auto max-h-100 w-full"
            />
          </div>
        )}

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/30 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium" title={file.name}>
              {file.name}
            </span>
            <span className="shrink-0 text-muted-foreground">
              ({formatSize(file.size)})
            </span>
          </div>

          {metadata && (
            <>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Maximize2 className="h-3.5 w-3.5" />
                <span>{metadata.width} × {metadata.height}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(metadata.duration)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                <span>{formatBitrate(metadata.estimatedBitrate)}</span>
              </div>
              {metadata.fps && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MonitorPlay className="h-3.5 w-3.5" />
                  <span>{metadata.fps} fps</span>
                </div>
              )}
            </>
          )}

          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChangeFile}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("replaceFile")}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input for change file */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

export { formatSize, formatDuration, calcEstimatedBitrate, formatBitrate };
