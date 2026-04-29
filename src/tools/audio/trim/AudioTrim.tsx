"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { WaveformSelector } from "@/components/shared/WaveformSelector";
import { TimeRangeSlider } from "@/components/shared/TimeRangeSlider";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { createToolTracker } from "@/lib/analytics";
import {
  trimAudio,
  trimAudioRemove,
  trimAudioWithFade,
  formatTimeDisplay,
  formatTimePrecise,
  parseTimeString,
} from "./logic";

const tracker = createToolTracker("trim", "audio");

const MIN_DURATION = 0.05;
const MAX_FADE = 3;
// Skip waveform decoding for files larger than this to avoid OOM on huge inputs.
const WAVEFORM_MAX_SIZE = 50 * 1024 * 1024;

type Mode = "keep" | "remove";

export default function AudioTrim() {
  const isClient = useIsClient();

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [decoding, setDecoding] = useState(false);

  const [mode, setMode] = useState<Mode>("keep");
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);

  const [startInput, setStartInput] = useState("0:00.000");
  const [endInput, setEndInput] = useState("0:00.000");
  const [startInvalid, setStartInvalid] = useState(false);
  const [endInvalid, setEndInvalid] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [loopActive, setLoopActive] = useState(false);

  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const loopActiveRef = useRef(false);
  const startRef = useRef(0);
  const endRef = useRef(0);
  // Bumped on every file change and every handleProcess invocation so that
  // an in-flight FFmpeg job whose file was swapped or superseded cannot
  // write its result back to UI state.
  const processGenRef = useRef(0);

  const fileUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.audio.trim");
  const startInputId = useId();
  const endInputId = useId();

  // Mirror state into refs so the rAF tick reads the latest values without
  // re-attaching listeners.
  useEffect(() => { startRef.current = start; }, [start]);
  useEffect(() => { endRef.current = end; }, [end]);
  useEffect(() => { loopActiveRef.current = loopActive; }, [loopActive]);

  // Decode the file once for waveform display. Skip large files.
  useEffect(() => {
    if (!file) {
      setAudioBuffer(null);
      return;
    }
    if (file.size > WAVEFORM_MAX_SIZE) {
      setAudioBuffer(null);
      return;
    }
    let cancelled = false;
    const ctx = new AudioContext();
    setDecoding(true);
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const decoded = await ctx.decodeAudioData(buf);
        if (!cancelled) setAudioBuffer(decoded);
      } catch (e) {
        console.warn("Waveform decode failed:", e);
      } finally {
        if (!cancelled) setDecoding(false);
      }
    })();
    return () => {
      cancelled = true;
      if (ctx.state !== "closed") ctx.close();
    };
  }, [file]);

  // Keep precise inputs synced with start/end (state -> input direction).
  useEffect(() => {
    setStartInput(formatTimePrecise(start));
    setStartInvalid(false);
  }, [start]);
  useEffect(() => {
    setEndInput(formatTimePrecise(end));
    setEndInvalid(false);
  }, [end]);

  // Cancel rAF on unmount to avoid leaks.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // Clamp fade values when the selection shrinks below them so the slider
  // reading matches what trimAudioWithFade will actually use.
  useEffect(() => {
    const dur = end - start;
    if (fadeIn > dur) setFadeIn(Math.max(0, dur));
    if (fadeOut > dur) setFadeOut(Math.max(0, dur));
    // Intentionally not depending on fadeIn/fadeOut to avoid re-running on
    // user-driven slider moves; only react to selection-length changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const handleFile = useCallback((files: File[]) => {
    // Invalidate any in-flight processing so its setResult cannot land here.
    // Also reset `processing` directly: the in-flight handleProcess's finally
    // block will skip its setProcessing(false) because the generation no
    // longer matches, which would otherwise leave the button permanently
    // disabled.
    processGenRef.current += 1;
    setProcessing(false);
    setProgress(0);
    setFile(files[0] || null);
    setAudioBuffer(null);
    setResult(null);
    setError("");
    setStart(0);
    setEnd(0);
    setDuration(0);
    setCurrentTime(0);
    setLoopActive(false);
    loopActiveRef.current = false;
    setMode("keep");
    setFadeEnabled(false);
    setFadeIn(0);
    setFadeOut(0);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioRef.current) audioRef.current.pause();
  }, []);

  function handleLoadedMetadata() {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setDuration(dur);
        setEnd(dur);
      }
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
      // Outer max(0) protects against `end - MIN_DURATION < 0` for very
      // short files. Inputting again normalises the field even when the
      // numeric value did not change (React would bail out of setStart).
      const next = Math.max(0, Math.min(clamped, end - MIN_DURATION));
      setStart(next);
      setStartInput(formatTimePrecise(next));
      setStartInvalid(false);
    } else {
      // Outer min(duration) protects against `start + MIN_DURATION > duration`.
      const next = Math.min(duration, Math.max(clamped, start + MIN_DURATION));
      setEnd(next);
      setEndInput(formatTimePrecise(next));
      setEndInvalid(false);
    }
  }

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) {
      rafRef.current = null;
      return;
    }
    const ct = audio.currentTime;
    setCurrentTime(ct);
    if (loopActiveRef.current && ct >= endRef.current) {
      audio.currentTime = startRef.current;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  function handleAudioPlay() {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  }

  function handleAudioPause() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    // Clear ref synchronously — the mirroring useEffect runs on the next
    // render and a quick pause→play (e.g. native scrubbing) would otherwise
    // restart the rAF tick with a stale ref.
    loopActiveRef.current = false;
    setLoopActive(false);
  }

  function handlePlaySelection() {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;
    if (loopActive) {
      audio.pause();
      return;
    }
    loopActiveRef.current = true;
    setLoopActive(true);
    audio.currentTime = start;
    audio.play().catch(() => {
      loopActiveRef.current = false;
      setLoopActive(false);
    });
  }

  const handleSeek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  function handleSetRingtone(seconds: number) {
    if (duration === 0) return;
    const newEnd = Math.min(duration, start + seconds);
    if (newEnd - start < MIN_DURATION) return;
    setEnd(newEnd);
  }

  async function handleProcess() {
    if (!file) return;
    const gen = ++processGenRef.current;
    setProcessing(true);
    setResult(null);
    setError("");
    setProgress(0);
    const t0 = performance.now();
    // Guard the progress callback too — superseded jobs would otherwise keep
    // pushing percentages into the UI long after the user moved on.
    const guardedProgress = (p: number) => {
      if (gen === processGenRef.current) setProgress(p);
    };
    try {
      let blob: Blob;
      if (mode === "remove") {
        blob = await trimAudioRemove(file, start, end, duration, guardedProgress);
      } else if (fadeEnabled && (fadeIn > 0 || fadeOut > 0)) {
        blob = await trimAudioWithFade(file, start, end, fadeIn, fadeOut, guardedProgress);
      } else {
        blob = await trimAudio(file, start, end, guardedProgress);
      }
      if (gen !== processGenRef.current) return;
      setResult(blob);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      if (gen !== processGenRef.current) return;
      console.error("Trim failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      if (gen === processGenRef.current) setProcessing(false);
    }
  }

  const reEncodes = mode === "remove" || (fadeEnabled && (fadeIn > 0 || fadeOut > 0));

  const downloadName = useMemo(() => {
    if (!file) return "trimmed.mp3";
    if (reEncodes) {
      const base = file.name.replace(/\.[^.]+$/, "");
      return `trimmed_${base}.mp3`;
    }
    return `trimmed_${file.name}`;
  }, [file, reEncodes]);

  if (!isClient) return null;

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="audio/*" onFiles={handleFile} />

      {file && fileUrl && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{file.name}</div>

          <audio
            ref={audioRef}
            src={fileUrl}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handleAudioPlay}
            onPause={handleAudioPause}
            onEnded={handleAudioPause}
            className="w-full"
          />

          {audioBuffer ? (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {t("waveform.label")}
              </div>
              <WaveformSelector
                audioBuffer={audioBuffer}
                start={start}
                end={end}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                height={88}
              />
            </div>
          ) : decoding ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
              {t("waveform.loading")}
            </div>
          ) : null}

          {duration > 0 && (
            <TimeRangeSlider
              duration={duration}
              startTime={start}
              endTime={end}
              minDuration={MIN_DURATION}
              onStartChange={setStart}
              onEndChange={setEnd}
            />
          )}

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
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                disabled={processing}
                placeholder="0:00.000"
                aria-invalid={startInvalid}
                className={`w-full rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm ${
                  startInvalid ? "border-red-500" : "border-border"
                }`}
              />
              {startInvalid && (
                <span className="mt-1 block text-xs text-red-500">{t("precise.invalid")}</span>
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
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                disabled={processing}
                placeholder="0:00.000"
                aria-invalid={endInvalid}
                className={`w-full rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm ${
                  endInvalid ? "border-red-500" : "border-border"
                }`}
              />
              {endInvalid && (
                <span className="mt-1 block text-xs text-red-500">{t("precise.invalid")}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>
              {t("start")}:{" "}
              <span className="font-mono text-foreground">{formatTimeDisplay(start)}</span>
            </span>
            <span>
              {t("end")}:{" "}
              <span className="font-mono text-foreground">{formatTimeDisplay(end)}</span>
            </span>
            <span>
              {t("duration")}:{" "}
              <span className="font-mono text-foreground">{formatTimeDisplay(end - start)}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex rounded-md border border-border p-0.5"
              role="tablist"
              aria-label={t("mode.label")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "keep"}
                onClick={() => setMode("keep")}
                disabled={processing}
                className={`rounded px-3 py-1 text-xs ${
                  mode === "keep" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t("mode.keep")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "remove"}
                onClick={() => setMode("remove")}
                disabled={processing}
                className={`rounded px-3 py-1 text-xs ${
                  mode === "remove" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t("mode.remove")}
              </button>
            </div>

            <span className="text-xs text-muted-foreground">{t("presets.label")}:</span>
            <button
              type="button"
              onClick={() => handleSetRingtone(30)}
              disabled={processing || duration === 0}
              className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              {t("presets.ringtone30")}
            </button>
            <button
              type="button"
              onClick={() => handleSetRingtone(40)}
              disabled={processing || duration === 0}
              className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              {t("presets.ringtone40")}
            </button>
          </div>

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
            )}
          </div>

          {reEncodes && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {mode === "remove" ? t("mode.removeWarning") : t("fade.warning")}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={loopActive ? "secondary" : "outline"}
              onClick={handlePlaySelection}
              disabled={processing || duration === 0}
            >
              {loopActive ? t("pauseSelection") : t("playSelection")}
            </Button>
            <Button onClick={handleProcess} disabled={processing || duration === 0}>
              {processing ? `${t("processing")} ${progress}%` : t("trim")}
            </Button>
          </div>

          {result && resultUrl && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <audio src={resultUrl} controls className="flex-1" />
              <DownloadButton data={result} filename={downloadName} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
