"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import {
  VideoUploader,
  formatSize,
  formatDuration,
  formatBitrate,
  calcEstimatedBitrate,
  type VideoMetadata,
} from "@/components/shared/VideoUploader";
import {
  compressVideo,
  PRESET_OPTIONS,
  RESOLUTION_HEIGHT,
  type Quality,
  type CompressOptions,
  type FFmpegPreset,
  type ResolutionOption,
  type FpsOption,
} from "./logic";

const QUALITIES: Quality[] = ["high", "medium", "low"];

const FFMPEG_PRESETS: FFmpegPreset[] = [
  "ultrafast", "superfast", "veryfast", "faster", "fast",
  "medium", "slow", "slower", "veryslow",
];

const RESOLUTIONS: ResolutionOption[] = [
  "original", "1080p", "720p", "480p", "360p",
];

const FPS_OPTIONS: FpsOption[] = ["original", "30", "24", "15"];

const AUDIO_BITRATES = ["64k", "96k", "128k", "192k", "256k"];

export default function VideoCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [advancedOptions, setAdvancedOptions] = useState<CompressOptions>({
    ...PRESET_OPTIONS.medium,
  });
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [sourceMetadata, setSourceMetadata] = useState<VideoMetadata | null>(null);
  const [outputMetadata, setOutputMetadata] = useState<VideoMetadata | null>(null);

  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const resultUrl = useObjectUrl(result);

  const t = useTranslations("tools.video.compress");
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg();

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
    setOutputMetadata(null);
    setError("");
    setProgress(0);
    const ff = await loadFFmpeg();
    if (!ff) {
      setProcessing(false);
      return;
    }
    try {
      const options = mode === "simple" ? quality : advancedOptions;
      const blob = await compressVideo(
        file,
        options,
        setProgress,
        sourceMetadata?.height,
        sourceMetadata?.fps,
      );
      setResult(blob);
    } catch (e) {
      console.error("Compress failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  function handleOutputMetadata() {
    const v = outputVideoRef.current;
    if (!v || !result) return;
    const baseMeta: VideoMetadata = {
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
      estimatedBitrate: calcEstimatedBitrate(result.size, v.duration),
      fileSize: result.size,
    };
    setOutputMetadata(baseMeta);
    detectOutputFps(v, baseMeta);
  }

  function detectOutputFps(v: HTMLVideoElement, baseMeta: VideoMetadata) {
    if (!("requestVideoFrameCallback" in v)) return;
    const savedTime = v.currentTime;
    const wasPaused = v.paused;
    const wasMuted = v.muted;
    let firstTime: number | null = null;

    v.muted = true;

    function onFrame(_now: DOMHighResTimeStamp, frameInfo: { mediaTime: number }) {
      if (firstTime === null) {
        firstTime = frameInfo.mediaTime;
        v.requestVideoFrameCallback(onFrame);
        return;
      }
      const delta = frameInfo.mediaTime - firstTime;
      v.pause();
      v.currentTime = savedTime;
      v.muted = wasMuted;
      if (!wasPaused) v.play().catch(() => {});
      if (delta > 0) {
        setOutputMetadata({ ...baseMeta, fps: Math.round(1 / delta) });
      }
    }

    v.requestVideoFrameCallback(onFrame);
    v.play().catch(() => {});
  }

  function updateAdvanced<K extends keyof CompressOptions>(
    key: K,
    value: CompressOptions[K],
  ) {
    setAdvancedOptions((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      {/* A. Video upload + preview */}
      <VideoUploader
        file={file}
        onFileChange={(f) => {
          setFile(f);
          setResult(null);
          setOutputMetadata(null);
          setSourceMetadata(null);
          setError("");
        }}
        onMetadataLoaded={setSourceMetadata}
      />

      {ffmpegStatus === "loading" && <FFmpegLoadingState />}

      {ffmpegStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {tc("ffmpegLoadError")}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          {/* B. Mode toggle */}
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "simple" | "advanced")}
          >
            <TabsList>
              <TabsTrigger value="simple">{t("simpleMode")}</TabsTrigger>
              <TabsTrigger value="advanced">{t("advancedMode")}</TabsTrigger>
            </TabsList>

            {/* C. Simple mode */}
            <TabsContent value="simple">
              <div className="space-y-3">
                {QUALITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      quality === q
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t(q)}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {t(`${q}Settings` as "highSettings")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`${q}Desc` as "highDesc")}
                    </p>
                    <p className="mt-1 text-xs text-primary/80">
                      {t(`${q}UseCase` as "highUseCase")}
                    </p>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* D. Advanced mode */}
            <TabsContent value="advanced">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* CRF slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("crfLabel")}
                    <span className="ml-2 font-mono text-primary">
                      {advancedOptions.crf}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={51}
                    step={1}
                    value={advancedOptions.crf}
                    onChange={(e) => updateAdvanced("crf", Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">{t("crfHint")}</p>
                </div>

                {/* Encoding preset */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("encodingPreset")}
                  </label>
                  <select
                    value={advancedOptions.preset}
                    onChange={(e) =>
                      updateAdvanced("preset", e.target.value as FFmpegPreset)
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {FFMPEG_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {t(`preset_${p}` as "preset_fast")}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {t("encodingPresetHint")}
                  </p>
                </div>

                {/* Resolution */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("resolutionLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RESOLUTIONS.map((r) => {
                      const exceedsSource =
                        r !== "original" &&
                        sourceMetadata &&
                        RESOLUTION_HEIGHT[r] > sourceMetadata.height;
                      return (
                        <Button
                          key={r}
                          variant={
                            advancedOptions.resolution === r
                              ? "primary"
                              : "outline"
                          }
                          size="sm"
                          disabled={!!exceedsSource}
                          onClick={() => updateAdvanced("resolution", r)}
                        >
                          {r === "original" ? t("resolutionOriginal") : r}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Frame rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("fpsLabel")}</label>
                  <div className="flex flex-wrap gap-2">
                    {FPS_OPTIONS.map((f) => {
                      const exceedsSource =
                        f !== "original" &&
                        sourceMetadata?.fps &&
                        Number(f) > sourceMetadata.fps;
                      return (
                        <Button
                          key={f}
                          variant={
                            advancedOptions.fps === f ? "primary" : "outline"
                          }
                          size="sm"
                          disabled={!!exceedsSource}
                          onClick={() => updateAdvanced("fps", f)}
                        >
                          {f === "original" ? t("fpsOriginal") : `${f} fps`}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Audio bitrate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("audioBitrateLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AUDIO_BITRATES.map((b) => (
                      <Button
                        key={b}
                        variant={
                          advancedOptions.audioBitrate === b
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => updateAdvanced("audioBitrate", b)}
                      >
                        {b}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Max bitrate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("maxBitrateLabel")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder={t("maxBitratePlaceholder")}
                      value={
                        advancedOptions.maxBitrate
                          ? parseFloat(advancedOptions.maxBitrate)
                          : ""
                      }
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        updateAdvanced(
                          "maxBitrate",
                          num > 0 ? `${num}M` : undefined,
                        );
                      }}
                      className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("maxBitrateUnit")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("maxBitrateHint")}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Progress */}
          {progress > 0 && progress < 100 && (
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Compress button */}
          <div className="flex items-center gap-4">
            <Button onClick={handleCompress} disabled={processing || !sourceMetadata}>
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

          {/* E. Result comparison */}
          {result && resultUrl && (
            <div className="space-y-4">
              {/* Output video preview */}
              <div className="overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="bg-black/5 dark:bg-black/20">
                  <video
                    ref={outputVideoRef}
                    src={resultUrl}
                    controls
                    onLoadedMetadata={handleOutputMetadata}
                    className="mx-auto max-h-[400px] w-full"
                  />
                </div>
              </div>

              {/* Comparison table */}
              <div className="overflow-hidden rounded-lg border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground" />
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        {t("sourceVideo")}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        {t("compressedVideo")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/20">
                      <td className="px-4 py-2 text-muted-foreground">
                        {t("fileSize")}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatSize(result.size)}
                      </td>
                    </tr>
                    {sourceMetadata && outputMetadata && (
                      <>
                        <tr className="border-b border-border/20">
                          <td className="px-4 py-2 text-muted-foreground">
                            {t("resolutionLabel")}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {sourceMetadata.width} × {sourceMetadata.height}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {outputMetadata.width} × {outputMetadata.height}
                          </td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="px-4 py-2 text-muted-foreground">
                            {t("duration")}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatDuration(sourceMetadata.duration)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatDuration(outputMetadata.duration)}
                          </td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="px-4 py-2 text-muted-foreground">
                            {t("bitrate")}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatBitrate(sourceMetadata.estimatedBitrate)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatBitrate(outputMetadata.estimatedBitrate)}
                          </td>
                        </tr>
                        {(sourceMetadata.fps || outputMetadata.fps) && (
                          <tr className="border-b border-border/20">
                            <td className="px-4 py-2 text-muted-foreground">
                              {t("fpsLabel")}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {sourceMetadata.fps ? `${sourceMetadata.fps} fps` : "-"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {outputMetadata.fps ? `${outputMetadata.fps} fps` : "-"}
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                    <tr>
                      <td className="px-4 py-2 font-medium">{t("saved")}</td>
                      <td />
                      {(() => {
                        const pct = Math.round((1 - result.size / file.size) * 100);
                        const isSmaller = pct > 0;
                        return (
                          <td className={`px-4 py-2 text-right font-mono font-semibold ${isSmaller ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {isSmaller ? `-${pct}%` : `+${Math.abs(pct)}%`}
                          </td>
                        );
                      })()}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
