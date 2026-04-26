"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import { Loader2, Sparkles } from "lucide-react";
import { convertHeic, decodeHeic, type DecodedHeic, type OutputFormat } from "./logic";

const tracker = createToolTracker("heic-convert", "image");

export default function HeicConvert() {
  const [file, setFile] = useState<File | null>(null);
  const [decoded, setDecoded] = useState<DecodedHeic | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState<OutputFormat | null>(null);
  const [quality, setQuality] = useState(0.85);
  const [result, setResult] = useState<ImageResultItem | null>(null);
  const [error, setError] = useState("");
  const convertIdRef = useRef(0);
  const t = useTranslations("tools.image.heic-convert");

  useEffect(() => {
    convertIdRef.current++;

    if (!file) {
      setDecoded(null);
      setAnalyzing(false);
      setConverting(null);
      setError("");
      setResult(null);
      return;
    }

    let cancelled = false;
    setAnalyzing(true);
    setDecoded(null);
    setConverting(null);
    setError("");
    setResult(null);

    decodeHeic(file)
      .then((d) => {
        if (!cancelled) setDecoded(d);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to read HEIC file";
        setError(msg);
        tracker.trackProcessError(msg);
      })
      .finally(() => {
        if (!cancelled) setAnalyzing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  function handleFileChange(f: File | null) {
    setFile(f);
  }

  async function doConvert(format: OutputFormat) {
    if (!file || !decoded || converting) return;
    const id = convertIdRef.current;
    setConverting(format);
    setError("");
    const start = Date.now();
    try {
      const blob = await convertHeic(file, decoded, format, quality);
      if (id !== convertIdRef.current) return;
      tracker.trackProcessComplete(Date.now() - start);
      const ext = format === "image/gif" ? "gif" : format === "image/jpeg" ? "jpg" : "png";
      const base = file.name.replace(/\.[^.]+$/, "") || "converted";
      setResult({ blob, filename: `${base}.${ext}` });
    } catch (e) {
      if (id !== convertIdRef.current) return;
      const msg = e instanceof Error ? e.message : "Conversion failed";
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      if (id === convertIdRef.current) setConverting(null);
    }
  }

  const formatButton = (format: OutputFormat, label: string) => (
    <Button
      key={format}
      variant="outline"
      size="sm"
      onClick={() => doConvert(format)}
      disabled={converting !== null}
    >
      {converting === format ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("converting")}
        </span>
      ) : (
        label
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      <SingleImageUpload
        file={file}
        onFileChange={handleFileChange}
        accept=".heic,.heif,image/heic,image/heif"
        disabled={analyzing || converting !== null}
      />

      {analyzing && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("analyzing")}
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          {decoded.frameCount > 1 && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{t("burstDetected", { count: decoded.frameCount })}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("quality")} <span className="text-xs font-normal text-muted-foreground">({t("jpgOnly")})</span>: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
              disabled={converting !== null}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("clickToConvert")}</p>
            <div className="flex flex-wrap gap-2">
              {formatButton("image/jpeg", "JPG")}
              {formatButton("image/png", "PNG")}
              {decoded.frameCount > 1 && formatButton("image/gif", "GIF")}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <ImageResultList
          results={[result]}
          onRemove={() => setResult(null)}
        />
      )}
    </div>
  );
}
