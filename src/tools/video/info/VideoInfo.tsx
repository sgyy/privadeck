"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileVideo, Video, Music, Loader2, Images } from "lucide-react";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  VideoUploader,
  formatSize,
  formatDuration,
  formatBitrate,
  type VideoMetadata,
} from "@/components/shared/VideoUploader";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { probeVideo, generateThumbnails, type ProbeResult } from "./logic";

interface Thumbnail {
  time: number;
  dataUrl: string;
}

export default function VideoInfo() {
  const isClient = useIsClient();
  const [file, setFile] = useState<File | null>(null);
  const [browserMeta, setBrowserMeta] = useState<VideoMetadata | null>(null);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState("");
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);

  const probeTriggered = useRef(false);

  const t = useTranslations("tools.video.info");

  const handleProbe = useCallback(async () => {
    if (!file || probing) return;
    setProbing(true);
    setError("");
    setProbeResult(null);
    try {
      const result = await probeVideo(file);
      setProbeResult(result);
    } catch (e) {
      console.error("Probe failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProbing(false);
    }
  }, [file, probing]);

  // Auto-trigger FFmpeg probe when browser metadata is ready
  useEffect(() => {
    if (browserMeta && file && !probeTriggered.current) {
      probeTriggered.current = true;
      handleProbe();
    }
  }, [browserMeta, file, handleProbe]);

  // Auto-generate thumbnails when browser metadata is ready
  useEffect(() => {
    if (!browserMeta || !file) return;
    let cancelled = false;
    setThumbLoading(true);
    generateThumbnails(file)
      .then((thumbs) => {
        if (!cancelled) setThumbnails(thumbs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setThumbLoading(false);
      });
    return () => { cancelled = true; };
  }, [browserMeta, file]);

  if (!isClient) {
    return null;
  }

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  function buildCopyText(): string {
    const lines: string[] = [];
    if (file) {
      lines.push(`${t("fileName")}: ${file.name}`);
      lines.push(`${t("fileSize")}: ${formatSize(file.size)}`);
      lines.push(`${t("fileType")}: ${file.type || "unknown"}`);
    }
    if (browserMeta) {
      lines.push(`${t("resolution")}: ${browserMeta.width} × ${browserMeta.height}`);
      lines.push(`${t("duration")}: ${formatDuration(browserMeta.duration)}`);
      lines.push(`${t("estimatedBitrate")}: ${formatBitrate(browserMeta.estimatedBitrate)}`);
      if (browserMeta.fps) lines.push(`${t("fps")}: ${browserMeta.fps}`);
    }
    if (probeResult) {
      if (probeResult.container) lines.push(`${t("container")}: ${probeResult.container}`);
      if (probeResult.totalBitrate) lines.push(`${t("totalBitrate")}: ${probeResult.totalBitrate}`);
      if (probeResult.startTime) lines.push(`${t("startTime")}: ${probeResult.startTime}s`);
      for (const s of probeResult.streams) {
        lines.push("");
        if (s.type === "video") {
          lines.push(`[${t("videoStream")} #${s.index}]`);
          lines.push(`  ${t("codec")}: ${s.codec}${s.profile ? ` (${s.profile})` : ""}`);
          if (s.resolution) lines.push(`  ${t("resolution")}: ${s.resolution}`);
          if (s.pixelFormat) lines.push(`  ${t("pixelFormat")}: ${s.pixelFormat}`);
          if (s.colorSpace) lines.push(`  ${t("colorSpace")}: ${s.colorSpace}`);
          if (s.scanType) lines.push(`  ${t("scanType")}: ${s.scanType}`);
          if (s.fps) lines.push(`  ${t("fps")}: ${s.fps}`);
          if (s.bitrate) lines.push(`  ${t("bitrate")}: ${s.bitrate}`);
        } else if (s.type === "audio") {
          lines.push(`[${t("audioStream")} #${s.index}]`);
          lines.push(`  ${t("codec")}: ${s.codec}${s.profile ? ` (${s.profile})` : ""}`);
          if (s.sampleRate) lines.push(`  ${t("sampleRate")}: ${s.sampleRate}`);
          if (s.channels) lines.push(`  ${t("channels")}: ${s.channels}`);
          if (s.bitrate) lines.push(`  ${t("bitrate")}: ${s.bitrate}`);
        }
      }
    }
    return lines.join("\n");
  }

  const videoStreams = probeResult?.streams.filter((s) => s.type === "video") ?? [];
  const audioStreams = probeResult?.streams.filter((s) => s.type === "audio") ?? [];

  return (
    <div className="space-y-4">
      {/* File upload + preview */}
      <VideoUploader
        file={file}
        onFileChange={(f) => {
          setFile(f);
          setBrowserMeta(null);
          setProbeResult(null);
          setThumbnails([]);
          setError("");
          probeTriggered.current = false;
        }}
        onMetadataLoaded={setBrowserMeta}
      />

      {file && (
        <div className="space-y-4">
          {/* Auto-probing indicator */}
          {probing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("autoAnalyzing")}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Thumbnail grid */}
          {(thumbnails.length > 0 || thumbLoading) && (
            <InfoSection icon={<Images className="h-4 w-4" />} title={t("thumbnails")}>
              <div className="p-3">
                {thumbLoading && thumbnails.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("autoAnalyzing")}
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {thumbnails.map((thumb) => (
                      <div key={thumb.time} className="space-y-1">
                        <img
                          src={thumb.dataUrl}
                          alt={`${formatTimestamp(thumb.time)}`}
                          className="w-full rounded border border-border/30 object-cover"
                        />
                        <p className="text-center text-xs font-mono text-muted-foreground">
                          {formatTimestamp(thumb.time)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </InfoSection>
          )}

          {/* File Info (always shown when file loaded) */}
          {browserMeta && (
            <InfoSection icon={<FileVideo className="h-4 w-4" />} title={t("fileInfo")}>
              <InfoRow label={t("fileName")} value={file.name} />
              <InfoRow label={t("fileSize")} value={formatSize(file.size)} />
              <InfoRow label={t("fileType")} value={file.type || "unknown"} />
              <InfoRow label={t("resolution")} value={`${browserMeta.width} × ${browserMeta.height}`} />
              <InfoRow label={t("duration")} value={formatDuration(browserMeta.duration)} />
              <InfoRow label={t("estimatedBitrate")} value={formatBitrate(browserMeta.estimatedBitrate)} />
              {browserMeta.fps && <InfoRow label={t("fps")} value={`${browserMeta.fps}`} />}
            </InfoSection>
          )}

          {/* FFmpeg Probe Results */}
          {probeResult && (
            <>
              {/* Container info */}
              {probeResult.container && (
                <InfoSection icon={<FileVideo className="h-4 w-4" />} title={t("containerInfo")}>
                  <InfoRow label={t("container")} value={probeResult.container} />
                  {probeResult.duration && <InfoRow label={t("duration")} value={probeResult.duration} />}
                  {probeResult.totalBitrate && <InfoRow label={t("totalBitrate")} value={probeResult.totalBitrate} />}
                  {probeResult.startTime && probeResult.startTime !== "0.000000" && (
                    <InfoRow label={t("startTime")} value={`${probeResult.startTime}s`} />
                  )}
                </InfoSection>
              )}

              {/* Video streams */}
              {videoStreams.map((stream) => (
                <InfoSection
                  key={`v${stream.index}`}
                  icon={<Video className="h-4 w-4" />}
                  title={`${t("videoStream")} #${stream.index}`}
                >
                  <InfoRow label={t("codec")} value={`${stream.codec}${stream.profile ? ` (${stream.profile})` : ""}`} />
                  {stream.resolution && <InfoRow label={t("resolution")} value={stream.resolution} />}
                  {stream.pixelFormat && <InfoRow label={t("pixelFormat")} value={stream.pixelFormat} />}
                  {stream.colorSpace && <InfoRow label={t("colorSpace")} value={stream.colorSpace} />}
                  {stream.scanType && <InfoRow label={t("scanType")} value={stream.scanType} />}
                  {stream.fps && <InfoRow label={t("fps")} value={`${stream.fps} fps`} />}
                  {stream.bitrate && <InfoRow label={t("bitrate")} value={stream.bitrate} />}
                </InfoSection>
              ))}

              {/* Audio streams */}
              {audioStreams.map((stream) => (
                <InfoSection
                  key={`a${stream.index}`}
                  icon={<Music className="h-4 w-4" />}
                  title={`${t("audioStream")} #${stream.index}`}
                >
                  <InfoRow label={t("codec")} value={`${stream.codec}${stream.profile ? ` (${stream.profile})` : ""}`} />
                  {stream.sampleRate && <InfoRow label={t("sampleRate")} value={stream.sampleRate} />}
                  {stream.channels && <InfoRow label={t("channels")} value={stream.channels} />}
                  {stream.bitrate && <InfoRow label={t("bitrate")} value={stream.bitrate} />}
                </InfoSection>
              ))}

              {/* Raw FFmpeg log */}
              <Accordion>
                <AccordionItem title={t("rawLog")}>
                  <div className="max-h-64 overflow-auto rounded bg-muted/50 p-3">
                    <pre className="whitespace-pre text-xs font-mono text-muted-foreground">
                      {probeResult.rawLog.join("\n")}
                    </pre>
                  </div>
                </AccordionItem>
              </Accordion>

              {/* Copy all info */}
              <CopyButton
                text={buildCopyText()}
                analyticsSlug="info"
                analyticsCategory="video"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      <div className="flex items-center gap-2 border-b border-border/30 bg-muted/50 px-4 py-2.5">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-border/20">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-mono font-medium" title={value}>
        {value}
      </span>
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
