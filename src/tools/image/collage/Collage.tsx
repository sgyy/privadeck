"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import {
  createCollage,
  getAvailableLayouts,
  getRequiredCount,
  type CollageLayout,
} from "./logic";

const tracker = createToolTracker("collage", "image");

export default function Collage() {
  const [files, setFiles] = useState<File[]>([]);
  const [layout, setLayout] = useState<CollageLayout>("2x1");
  const [gap, setGap] = useState(4);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.collage");
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

  function handleFilesChange(newFiles: File[]) {
    setFiles(newFiles);
    setResults([]);
    setError("");
  }

  async function handleCreate() {
    if (files.length < getRequiredCount(layout)) return;
    setProcessing(true);
    setError("");
    setResults([]);
    const start = Date.now();
    try {
      const blob = await createCollage(files, layout, gap, bgColor);
      tracker.trackProcessComplete(Date.now() - start);
      setResults((prev) => [...prev, { blob, filename: "collage.png" }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed";
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={handleFilesChange}
        disabled={processing}
      />

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

      {results.length > 0 && (
        <ImageResultList
          results={results}
          onRemove={(i) => setResults((prev) => prev.filter((_, idx) => idx !== i))}
        />
      )}
    </div>
  );
}
