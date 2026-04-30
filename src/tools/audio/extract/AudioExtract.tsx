"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, FileArchive, Loader2, Music, Settings2 } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { TimeRangeSlider } from "@/components/shared/TimeRangeSlider";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { createToolTracker } from "@/lib/analytics";
import {
  extractAudio,
  FORMATS,
  SAMPLE_RATES,
  isLossless,
  getExtension,
  getBitrateOptions,
  type AudioFormat,
  type ExtractOptions,
} from "./logic";
import { formatTimeDisplay, formatTimePrecise, parseTimeString } from "../trim/logic";

const tracker = createToolTracker("extract", "audio");

const MIN_DURATION = 0.05;
const MAX_FADE = 5;

type QualityPreset = "low" | "standard" | "high" | "lossless";

type SampleRateChoice = number | "keep";
type ChannelChoice = 1 | 2 | "keep";

type QueueItem = {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  result?: Blob;
  outputName?: string;
  error?: string;
};

const LOSSY_PRESETS: Record<
  Exclude<QualityPreset, "lossless">,
  { bitrate: number; sampleRate: SampleRateChoice }
> = {
  low: { bitrate: 128, sampleRate: 22050 },
  standard: { bitrate: 192, sampleRate: "keep" },
  high: { bitrate: 320, sampleRate: "keep" },
};

export default function AudioExtract() {
  const isClient = useIsClient();
  const t = useTranslations("tools.audio.extract");

  // ── Queue + format state (cloned from AudioConvert) ────────────────────
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [bitrate, setBitrate] = useState<number>(192);
  const [sampleRate, setSampleRate] = useState<SampleRateChoice>("keep");
  const [channels, setChannels] = useState<ChannelChoice>("keep");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Time range + fade state (cloned from AudioTrim) ────────────────────
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [startInput, setStartInput] = useState("0:00.000");
  const [endInput, setEndInput] = useState("0:00.000");
  const [startInvalid, setStartInvalid] = useState(false);
  const [endInvalid, setEndInvalid] = useState(false);
  const [loopActive, setLoopActive] = useState(false);
  const [rangeEnabled, setRangeEnabled] = useState(false);
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);

  // ── Processing state ───────────────────────────────────────────────────
  const [processing, setProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  // Sync re-entry guard (state lags one render; double-clicks would run twice).
  const processingRef = useRef(false);
  // Bumped on file change + each handleExtract; orphaned callbacks bail.
  const processGenRef = useRef(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const loopActiveRef = useRef(false);
  const startRef = useRef(0);
  const endRef = useRef(0);

  const startInputId = useId();
  const endInputId = useId();

  // Mirror state into refs so the rAF tick reads live values without
  // re-attaching listeners.
  useEffect(() => {
    startRef.current = start;
  }, [start]);
  useEffect(() => {
    endRef.current = end;
  }, [end]);
  useEffect(() => {
    loopActiveRef.current = loopActive;
  }, [loopActive]);

  // Cancel rAF on unmount.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // Keep precise inputs synced with start/end.
  useEffect(() => {
    setStartInput(formatTimePrecise(start));
    setStartInvalid(false);
  }, [start]);
  useEffect(() => {
    setEndInput(formatTimePrecise(end));
    setEndInvalid(false);
  }, [end]);

  // Clamp fade values when selection shrinks below them.
  useEffect(() => {
    const dur = end - start;
    if (fadeIn > dur) setFadeIn(Math.max(0, dur));
    if (fadeOut > dur) setFadeOut(Math.max(0, dur));
    // Only react to selection length, not the slider values themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const formatLossless = isLossless(format);
  const bitrateOpts = getBitrateOptions(format);
  // libopus rejects > 256 kbps. Derive effective value instead of mutating
  // state via useEffect — switching back to mp3 should restore the user's
  // 320 kbps preference instead of leaving it stuck at 256.
  const effectiveBitrate = format === "opus" ? Math.min(bitrate, 256) : bitrate;

  const isBatch = queue.length >= 2;
  const singleItem = queue.length === 1 ? queue[0] : null;
  const singleFile = singleItem?.file ?? null;
  const singleResult =
    singleItem?.status === "done" ? (singleItem.result ?? null) : null;
  const singleVideoUrl = useObjectUrl(singleFile);
  const resultUrl = useObjectUrl(singleResult);

  const activePreset = useMemo<QualityPreset | null>(() => {
    if (formatLossless) return "lossless";
    if (channels !== "keep") return null;
    if (effectiveBitrate === 128 && sampleRate === 22050) return "low";
    if (effectiveBitrate === 192 && sampleRate === "keep") return "standard";
    if (effectiveBitrate === 320 && sampleRate === "keep") return "high";
    return null;
  }, [formatLossless, effectiveBitrate, sampleRate, channels]);

  function handleFiles(files: File[]) {
    if (processingRef.current) return;
    // New files invalidate any in-flight job; bump the gen so its callbacks
    // bail out before they can land on the new selection.
    processGenRef.current += 1;
    setZipping(false);
    setQueue(
      files.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        status: "pending",
        progress: 0,
      })),
    );
    // Reset time-range / fade state — only meaningful for the new file.
    setDuration(0);
    setStart(0);
    setEnd(0);
    setLoopActive(false);
    loopActiveRef.current = false;
    setRangeEnabled(false);
    setFadeEnabled(false);
    setFadeIn(0);
    setFadeOut(0);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (videoRef.current) videoRef.current.pause();
  }

  function handleLoadedMetadata() {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (Number.isFinite(dur) && dur > 0) {
      setDuration(dur);
      setEnd(dur);
    }
  }

  function commitInput(field: "start" | "end") {
    const raw = field === "start" ? startInput : endInput;
    const parsed = parseTimeString(raw);
    if (parsed === null) {
      if (field === "start") {
        setStartInvalid(true);
        setStartInput(formatTimePrecise(start));
      } else {
        setEndInvalid(true);
        setEndInput(formatTimePrecise(end));
      }
      return;
    }
    const clamped = Math.max(0, Math.min(duration, parsed));
    if (field === "start") {
      const next = Math.max(0, Math.min(clamped, end - MIN_DURATION));
      setStart(next);
      setStartInput(formatTimePrecise(next));
      setStartInvalid(false);
    } else {
      const next = Math.min(duration, Math.max(clamped, start + MIN_DURATION));
      setEnd(next);
      setEndInput(formatTimePrecise(next));
      setEndInvalid(false);
    }
  }

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused) {
      rafRef.current = null;
      return;
    }
    if (loopActiveRef.current && video.currentTime >= endRef.current) {
      video.currentTime = startRef.current;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  function handleVideoPlay() {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  }

  function handleVideoPause() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    loopActiveRef.current = false;
    setLoopActive(false);
  }

  function handlePlaySelection() {
    const video = videoRef.current;
    if (!video || duration === 0) return;
    if (loopActive) {
      video.pause();
      return;
    }
    loopActiveRef.current = true;
    setLoopActive(true);
    video.currentTime = start;
    video.play().catch(() => {
      loopActiveRef.current = false;
      setLoopActive(false);
    });
  }

  function handlePreset(p: QualityPreset) {
    if (p === "lossless") {
      // Keep WAV if user already chose it; only default to FLAC when
      // switching from a lossy format.
      if (!formatLossless) setFormat("flac");
      setChannels("keep");
      return;
    }
    if (formatLossless) setFormat("mp3");
    setBitrate(LOSSY_PRESETS[p].bitrate);
    setSampleRate(LOSSY_PRESETS[p].sampleRate);
    setChannels("keep");
  }

  async function handleExtract() {
    if (queue.length === 0 || processingRef.current) return;
    processingRef.current = true;
    const gen = ++processGenRef.current;
    setProcessing(true);

    try {
      const t0 = performance.now();
      const ext = getExtension(format);

      // Single-file: optionally narrow to selection. Batch ignores time range
      // (per-file ranges would explode UX). Fades work in both modes — fadeIn
      // doesn't need source duration; fadeOut does, so we probe per-file
      // duration in batch mode (cheap metadata-only video load).
      const useRange = !isBatch && rangeEnabled && duration > 0 && end > start;
      const useFade = fadeEnabled && (fadeIn > 0 || fadeOut > 0);

      let successCount = 0;
      for (let i = 0; i < queue.length; i++) {
        if (gen !== processGenRef.current) return;
        const item = queue[i];
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i ? { ...q, status: "processing", progress: 0 } : q,
          ),
        );

        const options: ExtractOptions = {
          bitrate: formatLossless ? undefined : effectiveBitrate,
          sampleRate: sampleRate === "keep" ? undefined : sampleRate,
          channels: channels === "keep" ? undefined : channels,
        };
        if (useRange) {
          options.start = start;
          options.end = end;
        }
        if (useFade) {
          options.fadeIn = fadeIn;
          options.fadeOut = fadeOut;
          // Need source duration for fadeOut positioning. Single-file: usually
          // already have it from <video onLoadedMetadata>, but fall back to a
          // probe if the user clicked Extract before metadata arrived. Batch:
          // probe per-file. fadeIn doesn't need duration, so it still works
          // even when probing fails.
          if (!useRange && fadeOut > 0) {
            let probed = isBatch ? 0 : duration;
            if (probed <= 0) probed = await getDurationFromFile(item.file);
            if (probed > 0) options.duration = probed;
          }
        }

        try {
          const blob = await extractAudio(
            item.file,
            format,
            options,
            (p) => {
              if (gen !== processGenRef.current) return;
              setQueue((prev) =>
                prev.map((q, idx) => (idx === i ? { ...q, progress: p } : q)),
              );
            },
          );
          if (gen !== processGenRef.current) return;
          const outputName =
            item.file.name.replace(/\.[^.]+$/, "") + "." + ext;
          setQueue((prev) =>
            prev.map((q, idx) =>
              idx === i
                ? {
                    ...q,
                    status: "done",
                    progress: 100,
                    result: blob,
                    outputName,
                  }
                : q,
            ),
          );
          successCount++;
        } catch (e) {
          if (gen !== processGenRef.current) return;
          const msg = e instanceof Error ? e.message : String(e);
          setQueue((prev) =>
            prev.map((q, idx) =>
              idx === i ? { ...q, status: "error", error: msg } : q,
            ),
          );
          tracker.trackProcessError(msg);
        }
      }

      if (gen === processGenRef.current && successCount > 0) {
        tracker.trackProcessComplete(Math.round(performance.now() - t0));
      }
    } finally {
      // Unconditional cleanup: a stale-gen early return (from a future
      // handleFiles that bumps the gen mid-loop) would otherwise leave
      // processingRef stuck and freeze the UI. Today handleFiles bails on
      // processingRef so the gen never moves, but the guard is brittle if
      // someone removes that bail later. Keep cleanup invariant.
      processingRef.current = false;
      setProcessing(false);
    }
  }

  /** Read source duration via a throwaway video element. Used in batch mode
   *  where the main `<video>` isn't mounted. Times out at 5s to avoid hanging
   *  on stalled metadata fetches. Returns 0 on any failure — caller falls
   *  back to skipping fadeOut for that file. */
  async function getDurationFromFile(file: File): Promise<number> {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      const url = URL.createObjectURL(file);
      v.src = url;
      let settled = false;
      const finish = (d: number) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      v.onloadedmetadata = () => {
        const d = v.duration;
        finish(Number.isFinite(d) && d > 0 ? d : 0);
      };
      v.onerror = () => finish(0);
      setTimeout(() => finish(0), 5000);
    });
  }

  async function handleDownloadAllZip() {
    if (zipping) return;
    setZipping(true);
    try {
      const { zipSync } = await import("fflate");
      const used = new Set<string>();
      const entries: Record<string, Uint8Array> = {};
      for (const item of queue) {
        if (item.status !== "done" || !item.result || !item.outputName) continue;
        let name = item.outputName;
        let n = 2;
        while (used.has(name)) {
          const dot = item.outputName.lastIndexOf(".");
          const stem = item.outputName.slice(0, dot);
          const dext = item.outputName.slice(dot);
          name = `${stem}_${n}${dext}`;
          n++;
        }
        used.add(name);
        entries[name] = new Uint8Array(await item.result.arrayBuffer());
      }
      // Yield once so the disabled+spinner UI paints before zipSync (sync,
      // can block hundreds of ms). setTimeout, not rAF — rAF is throttled
      // in background tabs.
      await new Promise<void>((r) => setTimeout(r, 0));
      const zipped = zipSync(entries);
      const url = URL.createObjectURL(
        new Blob([zipped as BlobPart], { type: "application/zip" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `extracted-${queue.length}-files.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }

  if (!isClient) return null;

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  const allSettled =
    queue.length > 0 &&
    queue.every((q) => q.status === "done" || q.status === "error");
  const doneCount = queue.filter((q) => q.status === "done").length;

  const summaryLine = formatLossless
    ? t("advanced.summaryLossless")
    : `${effectiveBitrate} kbps · ${
        sampleRate === "keep" ? t("sampleRate.keep") : `${sampleRate / 1000} kHz`
      } · ${
        channels === "keep"
          ? t("channels.keep")
          : channels === 1
            ? t("channels.mono")
            : t("channels.stereo")
      }`;

  return (
    <div className="space-y-4">
      <FileDropzone accept="video/*" multiple onFiles={handleFiles} />

      {queue.length > 0 && (
        <div className="space-y-4">
          {isBatch ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span>{t("batch.fileCount", { count: queue.length })}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFiles([])}
                disabled={processing}
              >
                {t("clear")}
              </Button>
            </div>
          ) : (
            singleFile &&
            singleVideoUrl && (
              <div className="space-y-2">
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  {singleFile.name}
                </div>
                <video
                  ref={videoRef}
                  src={singleVideoUrl}
                  controls
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoPause}
                  className="max-h-[300px] w-full rounded-lg bg-black"
                />
              </div>
            )
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("format")}</label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFormat(f)}
                  disabled={processing}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("quality.label")}</label>
            <div className="flex flex-wrap gap-2">
              {(["low", "standard", "high", "lossless"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  disabled={processing}
                  className={`rounded-md border px-3 py-1.5 text-xs transition ${
                    activePreset === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t(`quality.${p}`)}
                </button>
              ))}
            </div>
          </div>

          <details
            open={advancedOpen}
            onToggle={(e) =>
              setAdvancedOpen((e.target as HTMLDetailsElement).open)
            }
            className="rounded-lg border border-border"
          >
            <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm font-medium">
              <Settings2 className="h-4 w-4" />
              {t("advanced.label")}
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {summaryLine}
              </span>
            </summary>
            <div className="space-y-3 border-t border-border px-3 py-3">
              <div className="space-y-1">
                <label
                  htmlFor="audio-extract-bitrate"
                  className="text-xs text-muted-foreground"
                >
                  {t("bitrate.label")}
                </label>
                <select
                  id="audio-extract-bitrate"
                  value={effectiveBitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  disabled={formatLossless || processing}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  {bitrateOpts.map((b) => (
                    <option key={b} value={b}>
                      {b} kbps
                    </option>
                  ))}
                </select>
                {formatLossless && (
                  <p className="text-xs text-muted-foreground">
                    {t("bitrate.disabled")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="audio-extract-sample-rate"
                  className="text-xs text-muted-foreground"
                >
                  {t("sampleRate.label")}
                </label>
                <select
                  id="audio-extract-sample-rate"
                  value={sampleRate}
                  onChange={(e) =>
                    setSampleRate(
                      e.target.value === "keep" ? "keep" : Number(e.target.value),
                    )
                  }
                  disabled={processing}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="keep">{t("sampleRate.keep")}</option>
                  {SAMPLE_RATES.map((sr) => (
                    <option key={sr} value={sr}>
                      {(sr / 1000).toFixed(sr === 22050 ? 2 : 0)} kHz
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="audio-extract-channels"
                  className="text-xs text-muted-foreground"
                >
                  {t("channels.label")}
                </label>
                <select
                  id="audio-extract-channels"
                  value={channels}
                  onChange={(e) =>
                    setChannels(
                      e.target.value === "keep"
                        ? "keep"
                        : (Number(e.target.value) as 1 | 2),
                    )
                  }
                  disabled={processing}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="keep">{t("channels.keep")}</option>
                  <option value={1}>{t("channels.mono")}</option>
                  <option value={2}>{t("channels.stereo")}</option>
                </select>
              </div>
            </div>
          </details>

          {!isBatch ? (
            <div className="rounded-lg border border-border p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rangeEnabled}
                  onChange={(e) => setRangeEnabled(e.target.checked)}
                  disabled={processing || duration === 0}
                  className="h-4 w-4 accent-primary"
                />
                <span>{t("timeRange.enable")}</span>
              </label>

              {rangeEnabled && duration > 0 && (
                <>
                  <TimeRangeSlider
                    duration={duration}
                    startTime={start}
                    endTime={end}
                    minDuration={MIN_DURATION}
                    onStartChange={setStart}
                    onEndChange={setEnd}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={startInputId}
                        className="mb-1 block text-xs text-muted-foreground"
                      >
                        {t("precise.start")}
                      </label>
                      <input
                        id={startInputId}
                        type="text"
                        value={startInput}
                        onChange={(e) => setStartInput(e.target.value)}
                        onBlur={() => commitInput("start")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            (e.target as HTMLInputElement).blur();
                        }}
                        disabled={processing}
                        placeholder="0:00.000"
                        aria-invalid={startInvalid}
                        className={`w-full rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm ${
                          startInvalid ? "border-red-500" : "border-border"
                        }`}
                      />
                      {startInvalid && (
                        <span className="mt-1 block text-xs text-red-500">
                          {t("precise.invalid")}
                        </span>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={endInputId}
                        className="mb-1 block text-xs text-muted-foreground"
                      >
                        {t("precise.end")}
                      </label>
                      <input
                        id={endInputId}
                        type="text"
                        value={endInput}
                        onChange={(e) => setEndInput(e.target.value)}
                        onBlur={() => commitInput("end")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            (e.target as HTMLInputElement).blur();
                        }}
                        disabled={processing}
                        placeholder="0:00.000"
                        aria-invalid={endInvalid}
                        className={`w-full rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm ${
                          endInvalid ? "border-red-500" : "border-border"
                        }`}
                      />
                      {endInvalid && (
                        <span className="mt-1 block text-xs text-red-500">
                          {t("precise.invalid")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {t("start")}:{" "}
                      <span className="font-mono text-foreground">
                        {formatTimeDisplay(start)}
                      </span>
                    </span>
                    <span>
                      {t("end")}:{" "}
                      <span className="font-mono text-foreground">
                        {formatTimeDisplay(end)}
                      </span>
                    </span>
                    <span>
                      {t("duration")}:{" "}
                      <span className="font-mono text-foreground">
                        {formatTimeDisplay(end - start)}
                      </span>
                    </span>
                    <Button
                      variant={loopActive ? "secondary" : "outline"}
                      size="sm"
                      onClick={handlePlaySelection}
                      disabled={processing || duration === 0}
                    >
                      {loopActive ? t("pauseSelection") : t("playSelection")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              {t("timeRange.batchHidden")}
            </div>
          )}

          <div className="rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fadeEnabled}
                onChange={(e) => setFadeEnabled(e.target.checked)}
                disabled={processing}
                className="h-4 w-4 accent-primary"
              />
              <span>{t("fade.enable")}</span>
            </label>
            {fadeEnabled && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("fade.in")}</span>
                      <span className="font-mono">{fadeIn.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={MAX_FADE}
                      step={0.1}
                      value={fadeIn}
                      onChange={(e) => setFadeIn(Number(e.target.value))}
                      disabled={processing}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("fade.out")}</span>
                      <span className="font-mono">{fadeOut.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={MAX_FADE}
                      step={0.1}
                      value={fadeOut}
                      onChange={(e) => setFadeOut(Number(e.target.value))}
                      disabled={processing}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleExtract} disabled={processing}>
              {processing ? t("extracting") : t("extract")}
            </Button>
            {processing && isBatch && (
              <span className="text-sm text-muted-foreground">
                {doneCount} / {queue.length}
              </span>
            )}
          </div>

          {isBatch && (
            <div className="space-y-2">
              {queue.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  pendingLabel={t("batch.status.pending")}
                />
              ))}
              {allSettled && doneCount >= 2 && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <FileArchive className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {t("batch.allDone", { done: doneCount, total: queue.length })}
                  </span>
                  <Button
                    onClick={handleDownloadAllZip}
                    className="ml-auto"
                    size="sm"
                    disabled={zipping}
                  >
                    {zipping ? t("batch.zipping") : t("batch.downloadAllZip")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isBatch && singleResult && resultUrl && singleItem?.outputName && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <audio src={resultUrl} controls className="flex-1" />
              <DownloadButton data={singleResult} filename={singleItem.outputName} />
            </div>
          )}
          {!isBatch && singleItem?.status === "error" && singleItem.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {singleItem.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QueueItemCard({
  item,
  pendingLabel,
}: {
  item: QueueItem;
  pendingLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <Music className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate">{item.file.name}</div>
        {item.status === "processing" && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
        {item.status === "error" && item.error && (
          <div className="truncate text-xs text-red-600 dark:text-red-400">
            {item.error}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {item.status === "pending" && (
          <span className="text-xs text-muted-foreground">{pendingLabel}</span>
        )}
        {item.status === "processing" && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        {item.status === "done" && item.result && item.outputName && (
          <DownloadButton data={item.result} filename={item.outputName} />
        )}
        {item.status === "error" && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}
