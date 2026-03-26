"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { createToolTracker } from "@/lib/analytics";
import { adjustVolume } from "./logic";

const tracker = createToolTracker("volume", "audio");

export default function AudioVolume() {
  const [file, setFile] = useState<File | null>(null);
  const [volume, setVolume] = useState(100);
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
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg({ preload: true });

  const stopPreview = useCallback((skipStateUpdate = false) => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        /* already stopped */
      }
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    gainRef.current = null;
    if (!skipStateUpdate) setPreviewing(false);
  }, []);

  useEffect(() => {
    return () => {
      stopPreview(true);
    };
  }, [stopPreview]);

  const handleFile = (files: File[]) => {
    stopPreview();
    setFile(files[0] || null);
    setResult(null);
    setVolume(100);
    setError("");
  };

  const handlePreview = async () => {
    if (!file || processing) return;
    if (previewing) {
      stopPreview();
      return;
    }
    setPreviewing(true);

    try {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gain = audioCtx.createGain();
      gain.gain.value = volume / 100;

      source.connect(gain);
      gain.connect(audioCtx.destination);

      gainRef.current = gain;
      sourceRef.current = source;

      source.onended = () => {
        stopPreview();
      };

      source.start();
    } catch (e) {
      console.error("Preview failed:", e);
      setError(String(e instanceof Error ? e.message : e));
      stopPreview();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (gainRef.current) {
      gainRef.current.gain.value = newVolume / 100;
    }
  };

  const handleApply = async () => {
    if (!file) return;
    stopPreview();
    setProcessing(true);
    setResult(null);
    setError("");
    const startTime = performance.now();
    const ff = await loadFFmpeg();
    if (!ff) { setProcessing(false); return; }
    try {
      const blob = await adjustVolume(file, volume, setProgress);
      setResult(blob);
      tracker.trackProcessComplete(Math.round(performance.now() - startTime));
    } catch (e) {
      console.error("Volume adjust failed:", e);
      const msg = String(e instanceof Error ? e.message : e);
      setError(msg);
      tracker.trackProcessError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const unsupported = !isSharedArrayBufferSupported();

  return (
    <div className="space-y-4">
      {unsupported ? (
        <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
        </div>
      ) : (
        <>
          <FileDropzone accept="audio/*" onFiles={handleFile} />

          {ffmpegStatus === "loading" && <FFmpegLoadingState />}

          {ffmpegStatus === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {tc("ffmpegLoadError")}
            </div>
          )}

          {file && fileUrl && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{file.name}</div>
              <audio src={fileUrl} controls className="w-full" />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t("volume")}</span>
                  <span className="font-mono text-muted-foreground">{volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={1}
                  value={volume}
                  disabled={processing}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                  <span>300%</span>
                </div>
              </div>

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
                  <DownloadButton data={result} filename={`volume_${volume}_${file.name}`} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
