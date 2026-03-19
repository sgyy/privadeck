"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import {
  createCollage,
  getAvailableLayouts,
  getRequiredCount,
  type CollageLayout,
} from "./logic";

export default function Collage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<CollageLayout>("2x1");
  const [gap, setGap] = useState(4);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const previewUrlsRef = useRef<string[]>([]);
  const t = useTranslations("tools.image.collage");

  const resultUrl = useObjectUrl(result);
  const availableLayouts = useMemo(
    () => getAvailableLayouts(files.length),
    [files.length],
  );

  // Reset layout if current one is no longer available
  useEffect(() => {
    if (availableLayouts.length > 0 && !availableLayouts.includes(layout)) {
      setLayout(availableLayouts[0]);
    }
  }, [availableLayouts, layout]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function handleFiles(newFiles: File[]) {
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => {
      const updated = [...prev, ...newUrls];
      previewUrlsRef.current = updated;
      return updated;
    });
    setResult(null);
    setError("");
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      previewUrlsRef.current = updated;
      return updated;
    });
    setResult(null);
  }

  async function handleCreate() {
    if (files.length < getRequiredCount(layout)) return;
    setProcessing(true);
    setError("");
    try {
      const blob = await createCollage(files, layout, gap, bgColor);
      setResult(blob);
    } catch (e) {
      console.error("Collage creation failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/*" multiple onFiles={handleFiles} />

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-border"
            >
              <img
                src={previewUrls[i]}
                alt={file.name}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="truncate px-1 py-0.5 text-xs">{file.name}</p>
            </div>
          ))}
        </div>
      )}

      {files.length >= 2 && (
        <div className="space-y-4">
          {/* Layout selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("layout")}</label>
            <div className="flex flex-wrap gap-2">
              {availableLayouts.map((l) => (
                <Button
                  key={l}
                  variant={layout === l ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setLayout(l)}
                >
                  {l} ({getRequiredCount(l)})
                </Button>
              ))}
            </div>
          </div>

          {/* Gap slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("gap")}: {gap}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Background color */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("bgColor")}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-border"
              />
              <span className="text-sm text-muted-foreground">{bgColor}</span>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={files.length < getRequiredCount(layout) || processing}
          >
            {processing ? t("processing") : t("create")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {result && resultUrl && (
        <div className="space-y-3">
          <img
            src={resultUrl}
            alt="Result"
            className="max-h-96 rounded-lg"
          />
          <DownloadButton data={result} filename="collage.png" />
        </div>
      )}
    </div>
  );
}
