"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { WaveformCanvas } from "@/components/shared/WaveformCanvas";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { createToolTracker } from "@/lib/analytics";
import { adjustVolume, dbToGain, gainToDb, type VolumeUnit } from "./logic";

const tracker = createToolTracker("volume", "audio");

const DB_MIN = -20;
const DB_MAX = 20;
const PCT_MIN = 0;
const PCT_MAX = 300;

const PRESET_GAINS = [0, 0.5, 1, 1.5, 2] as const;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function roundTo(value: number, decimals: number) {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

export default function AudioVolume() {
  const isClient = useIsClient();
  const [file, setFile] = useState<File | null>(null);
  const [unit, setUnit] = useState<VolumeUnit>("percent");
  const [value, setValue] = useState(100);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const fileUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result);

  const t = useTranslations("tools.audio.volume");

  const unsupported = !isSharedArrayBufferSupported();

  const gain = useMemo(() => {
    if (unit === "percent") return value / 100;
    return value <= DB_MIN ? 0 : dbToGain(value);
  }, [unit, value]);

  const isClipping = gain > 1.001;

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const ctx = new AudioContext();
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const decoded = await ctx.decodeAudioData(buf);
        if (!cancelled) setAudioBuffer(decoded);
      } catch (e) {
        console.warn("Waveform decode failed:", e);
      }
    })();
    return () => {
      cancelled = true;
      if (ctx.state !== "closed") ctx.close();
    };
  }, [file]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = gain;
  }, [gain]);

  function handleFile(files: File[]) {
    setFile(files[0] || null);
    setAudioBuffer(null);
    setResult(null);
    setError("");
  }

  function handleSliderChange(next: number) {
    if (unit === "percent") setValue(clamp(Math.round(next), PCT_MIN, PCT_MAX));
    else setValue(clamp(roundTo(next, 1), DB_MIN, DB_MAX));
  }

  function handleUnitToggle(next: VolumeUnit) {
    if (next === unit) return;
    if (next === "db") {
      const g = value / 100;
      const db = g <= 0 ? DB_MIN : roundTo(gainToDb(g), 1);
      setValue(clamp(db, DB_MIN, DB_MAX));
    } else {
      const g = value <= DB_MIN ? 0 : dbToGain(value);
      setValue(clamp(Math.round(g * 100), PCT_MIN, PCT_MAX));
    }
    setUnit(next);
  }

  function handlePreset(targetGain: number) {
    if (unit === "percent") {
      setValue(clamp(Math.round(targetGain * 100), PCT_MIN, PCT_MAX));
    } else if (targetGain === 0) {
      setValue(DB_MIN);
    } else {
      setValue(clamp(roundTo(gainToDb(targetGain), 1), DB_MIN, DB_MAX));
    }
  }

  async function handlePreview() {
    if (!file) return;
    if (previewing) {
      setPreviewing(false);
      if (sourceRef.current) {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
      sourceRef.current = null;
      gainRef.current = null;
      return;
    }
    setPreviewing(true);
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const buf = audioBuffer ?? (await audioCtx.decodeAudioData(await file.arrayBuffer()));
      const source = audioCtx.createBufferSource();
      sourceRef.current = source;
      source.buffer = buf;
      const gainNode = audioCtx.createGain();
      gainRef.current = gainNode;
      gainNode.gain.value = gain;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start();
      source.onended = () => {
        setPreviewing(false);
        audioCtx.close();
        audioCtxRef.current = null;
        sourceRef.current = null;
        gainRef.current = null;
      };
    } catch (e) {
      console.error("Preview failed:", e);
      setPreviewing(false);
    }
  }

  async function handleApply() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const t0 = performance.now();
    try {
      const blob = await adjustVolume(file, value, unit, setProgress);
      setResult(blob);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Apply volume failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }

  if (!isClient) return null;

  const sliderMin = unit === "percent" ? PCT_MIN : DB_MIN;
  const sliderMax = unit === "percent" ? PCT_MAX : DB_MAX;
  const sliderStep = unit === "percent" ? 1 : 0.5;
  const valueLabel = unit === "percent" ? `${value}%` : `${value > 0 ? "+" : ""}${value.toFixed(1)} dB`;

  function presetLabel(g: number) {
    if (g === 0) return t("presetMute");
    if (unit === "percent") return `${Math.round(g * 100)}%`;
    if (g === 1) return "0 dB";
    const db = roundTo(gainToDb(g), 1);
    return `${db > 0 ? "+" : ""}${db} dB`;
  }

  const downloadName = `volume_${unit === "percent" ? `${value}pct` : `${value}db`}_${file?.name ?? "audio"}`;

  return (
    <div className="space-y-4">
      {unsupported ? (
        <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
        </div>
      ) : (
        <>
          <FileDropzone accept="audio/*" onFiles={handleFile} />

          {file && fileUrl && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{file.name}</div>
              <audio src={fileUrl} controls className="w-full" />

              {audioBuffer && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {t("waveform")}
                  </div>
                  <WaveformCanvas
                    audioBuffer={audioBuffer}
                    gain={gain}
                    height={72}
                    className="text-primary"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{t("volume")}</div>
                <div
                  className="inline-flex rounded-md border border-border p-0.5"
                  role="tablist"
                  aria-label={t("volume")}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={unit === "percent"}
                    onClick={() => handleUnitToggle("percent")}
                    className={`rounded px-2 py-0.5 text-xs ${
                      unit === "percent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t("unitPercent")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={unit === "db"}
                    onClick={() => handleUnitToggle("db")}
                    className={`rounded px-2 py-0.5 text-xs ${
                      unit === "db" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t("unitDb")}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="self-center text-xs text-muted-foreground">{t("preset")}:</span>
                {PRESET_GAINS.map((g) => {
                  const active = Math.abs(g - gain) < 0.005;
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handlePreset(g)}
                      disabled={processing}
                      className={`rounded-md border px-2.5 py-1 text-xs transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {presetLabel(g)}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-end text-sm">
                  <span className="font-mono">{valueLabel}</span>
                </div>
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={sliderStep}
                  value={value}
                  disabled={processing}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="relative h-3 text-xs text-muted-foreground">
                  {unit === "percent" ? (
                    <>
                      <span className="absolute left-0">0%</span>
                      <span
                        className="absolute -translate-x-1/2 font-medium text-foreground"
                        style={{ left: `${(100 / PCT_MAX) * 100}%` }}
                      >
                        100%
                      </span>
                      <span className="absolute right-0">{PCT_MAX}%</span>
                    </>
                  ) : (
                    <>
                      <span className="absolute left-0">{DB_MIN} dB</span>
                      <span
                        className="absolute -translate-x-1/2 font-medium text-foreground"
                        style={{ left: `${((0 - DB_MIN) / (DB_MAX - DB_MIN)) * 100}%` }}
                      >
                        0 dB
                      </span>
                      <span className="absolute right-0">+{DB_MAX} dB</span>
                    </>
                  )}
                </div>
              </div>

              {isClipping && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{t("clipping")}</span>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button variant={previewing ? "secondary" : "outline"} onClick={handlePreview} disabled={processing}>
                  {previewing ? t("stop") : t("preview")}
                </Button>
                <Button onClick={handleApply} disabled={processing}>
                  {processing ? `${t("processing")} ${progress}%` : t("apply")}
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
        </>
      )}
    </div>
  );
}
