"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { adjustVolume } from "./logic";

export default function AudioVolume() {
  const isClient = useIsClient();
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

  const unsupported = !isSharedArrayBufferSupported();

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, []);

  function handleFile(files: File[]) {
    setFile(files[0] || null);
    setResult(null);
    setError("");
  }

  function handleVolumeChange(value: number) {
    setVolume(value);
    if (gainRef.current) {
      gainRef.current.gain.value = value / 100;
    }
  }

  async function handlePreview() {
    if (!file) return;
    if (previewing) {
      setPreviewing(false);
      sourceRef.current?.stop();
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      sourceRef.current = null;
      gainRef.current = null;
      return;
    }
    setPreviewing(true);
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      sourceRef.current = source;
      source.buffer = audioBuffer;
      const gainNode = audioCtx.createGain();
      gainRef.current = gainNode;
      gainNode.gain.value = volume / 100;
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
    try {
      const blob = await adjustVolume(file, volume, setProgress);
      setResult(blob);
    } catch (e) {
      console.error("Apply volume failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  if (!isClient) {
    return null;
  }

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
