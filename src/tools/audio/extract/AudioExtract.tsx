"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { isSharedArrayBufferSupported } from "@/lib/ffmpeg";
import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { FFmpegLoadingState } from "@/components/shared/FFmpegLoadingState";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { extractAudio, type OutputFormat } from "./logic";

const FORMATS: OutputFormat[] = ["mp3", "wav", "aac"];

export default function AudioExtract() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result);
  const t = useTranslations("tools.audio.extract");
  const tc = useTranslations("common");

  const { status: ffmpegStatus, load: loadFFmpeg } = useFFmpeg({ preload: true });

  if (!isSharedArrayBufferSupported()) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  async function handleExtract() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    const ff = await loadFFmpeg();
    if (!ff) { setProcessing(false); return; }
    try {
      const blob = await extractAudio(file, format, setProgress);
      setResult(blob);
    } catch (e) {
      console.error("Extract failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="video/*" onFiles={(f) => { setFile(f[0]); setResult(null); setError(""); }} />

      {ffmpegStatus === "loading" && <FFmpegLoadingState />}

      {ffmpegStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {tc("ffmpegLoadError")}
        </div>
      )}

      {file && fileUrl && (
        <div className="space-y-3">
          <video src={fileUrl} controls className="max-h-[300px] w-full rounded-lg" />

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("format")}</label>
              <Select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)}>
                {FORMATS.map((f) => (<option key={f} value={f}>{f.toUpperCase()}</option>))}
              </Select>
            </div>
            <Button onClick={handleExtract} disabled={processing}>
              {processing ? `${t("extracting")} ${progress}%` : t("extract")}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
          )}

          {result && resultUrl && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <audio src={resultUrl} controls className="flex-1" />
              <DownloadButton data={result} filename={file.name.replace(/\.[^.]+$/, `.${format}`)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
