"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Music, Settings2, Loader2, AlertCircle, FileArchive } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { createToolTracker } from "@/lib/analytics";
import {
  convertAudio,
  FORMATS,
  SAMPLE_RATES,
  isLossless,
  getExtension,
  getBitrateOptions,
  type AudioFormat,
  type ConvertOptions,
} from "./logic";

const tracker = createToolTracker("convert", "audio");

type QualityPreset = "low" | "standard" | "high" | "lossless";

type QueueItem = {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  result?: Blob;
  outputName?: string;
  error?: string;
};

type SampleRateChoice = number | "keep";
type ChannelChoice = 1 | 2 | "keep";

const LOSSY_PRESETS: Record<Exclude<QualityPreset, "lossless">, { bitrate: number; sampleRate: SampleRateChoice }> = {
  low: { bitrate: 128, sampleRate: 22050 },
  standard: { bitrate: 192, sampleRate: "keep" },
  high: { bitrate: 320, sampleRate: "keep" },
};

export default function AudioConvert() {
  const isClient = useIsClient();
  const t = useTranslations("tools.audio.convert");

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [bitrate, setBitrate] = useState<number>(192);
  const [sampleRate, setSampleRate] = useState<SampleRateChoice>("keep");
  const [channels, setChannels] = useState<ChannelChoice>("keep");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  // Synchronous re-entry guard. `processing` state lags one render behind
  // setProcessing(true), so a fast double-click can launch two parallel
  // batch loops that interleave setQueue updates and corrupt progress display.
  const processingRef = useRef(false);

  const formatLossless = isLossless(format);
  const bitrateOpts = getBitrateOptions(format);
  // libopus rejects > 256 kbps. Derive the effective value instead of mutating
  // state via useEffect — that would cause a one-frame UI mismatch (the select
  // would briefly show 320 before the clamp landed). Keeping `bitrate` as the
  // user's preferred value also means switching back to mp3 restores 320.
  const effectiveBitrate = format === "opus" ? Math.min(bitrate, 256) : bitrate;

  const singleFile = queue.length === 1 ? queue[0].file : null;
  const singleResult =
    queue.length === 1 && queue[0].status === "done" ? queue[0].result ?? null : null;
  const singleUrl = useObjectUrl(singleFile);
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
    // Block drops during a running batch — handleConvert closes over the queue
    // array length at start, so replacing the queue mid-loop would make every
    // subsequent setQueue(idx === i) write land on the wrong row (or no row at
    // all if the new queue is shorter), corrupting per-file status display.
    if (processingRef.current) return;
    setQueue(
      files.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        status: "pending",
        progress: 0,
      })),
    );
  }

  function handlePreset(p: QualityPreset) {
    if (p === "lossless") {
      // Keep WAV if the user already chose it; only default to FLAC when
      // switching from a lossy format. Silently rewriting WAV→FLAC would
      // surprise users who deliberately picked PCM for editing.
      if (!formatLossless) setFormat("flac");
      setChannels("keep");
      return;
    }
    if (formatLossless) setFormat("mp3");
    setBitrate(LOSSY_PRESETS[p].bitrate);
    setSampleRate(LOSSY_PRESETS[p].sampleRate);
    setChannels("keep");
  }

  async function handleConvert() {
    if (queue.length === 0 || processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      const t0 = performance.now();
      const options: ConvertOptions = {
        bitrate: formatLossless ? undefined : effectiveBitrate,
        sampleRate: sampleRate === "keep" ? undefined : sampleRate,
        channels: channels === "keep" ? undefined : channels,
      };
      const ext = getExtension(format);

      let successCount = 0;
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: "processing", progress: 0 } : q)),
        );
        try {
          const blob = await convertAudio(
            item.file,
            format,
            (p) =>
              setQueue((prev) =>
                prev.map((q, idx) => (idx === i ? { ...q, progress: p } : q)),
              ),
            options,
          );
          const outputName = item.file.name.replace(/\.[^.]+$/, "") + "." + ext;
          setQueue((prev) =>
            prev.map((q, idx) =>
              idx === i ? { ...q, status: "done", progress: 100, result: blob, outputName } : q,
            ),
          );
          successCount++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setQueue((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, status: "error", error: msg } : q)),
          );
          tracker.trackProcessError(msg);
        }
      }

      if (successCount > 0) {
        tracker.trackProcessComplete(Math.round(performance.now() - t0));
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
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
      // Yield once so the disabled+spinner UI paints before zipSync (which is
      // synchronous and can block ~hundreds of ms on large queues). setTimeout
      // instead of rAF — rAF is throttled / frozen in background tabs, so a
      // user who clicks then switches tabs would see the button hang forever.
      await new Promise<void>((r) => setTimeout(r, 0));
      const zipped = zipSync(entries);
      const url = URL.createObjectURL(new Blob([zipped as BlobPart], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted-${queue.length}-files.zip`;
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

  const isBatch = queue.length >= 2;
  const allSettled = queue.length > 0 && queue.every((q) => q.status === "done" || q.status === "error");
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
      <FileDropzone accept="audio/*" multiple onFiles={handleFiles} />

      {queue.length > 0 && (
        <div className="space-y-4">
          {isBatch ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span>{t("batch.fileCount", { count: queue.length })}</span>
              <Button size="sm" variant="outline" onClick={() => setQueue([])} disabled={processing}>
                {t("clear")}
              </Button>
            </div>
          ) : (
            singleFile &&
            singleUrl && (
              <div className="space-y-2">
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{singleFile.name}</div>
                <audio src={singleUrl} controls className="w-full" />
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
            onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
            className="rounded-lg border border-border"
          >
            <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm font-medium">
              <Settings2 className="h-4 w-4" />
              {t("advanced.label")}
              <span className="ml-auto text-xs font-normal text-muted-foreground">{summaryLine}</span>
            </summary>
            <div className="space-y-3 border-t border-border px-3 py-3">
              <div className="space-y-1">
                <label htmlFor="audio-convert-bitrate" className="text-xs text-muted-foreground">
                  {t("bitrate.label")}
                </label>
                <select
                  id="audio-convert-bitrate"
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
                  <p className="text-xs text-muted-foreground">{t("bitrate.disabled")}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="audio-convert-sample-rate" className="text-xs text-muted-foreground">
                  {t("sampleRate.label")}
                </label>
                <select
                  id="audio-convert-sample-rate"
                  value={sampleRate}
                  onChange={(e) =>
                    setSampleRate(e.target.value === "keep" ? "keep" : Number(e.target.value))
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
                <label htmlFor="audio-convert-channels" className="text-xs text-muted-foreground">
                  {t("channels.label")}
                </label>
                <select
                  id="audio-convert-channels"
                  value={channels}
                  onChange={(e) =>
                    setChannels(
                      e.target.value === "keep" ? "keep" : (Number(e.target.value) as 1 | 2),
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

          <div className="flex items-center gap-3">
            <Button onClick={handleConvert} disabled={processing}>
              {processing ? t("converting") : t("convert")}
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
                <QueueItemCard key={item.id} item={item} pendingLabel={t("batch.status.pending")} />
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

          {!isBatch && singleResult && resultUrl && queue[0].outputName && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <audio src={resultUrl} controls className="flex-1" />
              <DownloadButton data={singleResult} filename={queue[0].outputName} />
            </div>
          )}
          {!isBatch && queue[0]?.status === "error" && queue[0].error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {queue[0].error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QueueItemCard({ item, pendingLabel }: { item: QueueItem; pendingLabel: string }) {
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
          <div className="truncate text-xs text-red-600 dark:text-red-400">{item.error}</div>
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
        {item.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  );
}
