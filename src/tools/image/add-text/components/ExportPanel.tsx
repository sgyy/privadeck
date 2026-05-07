"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useEditor } from "../EditorContext";
import { exportImage, type ExportFormat } from "../lib/exporter";
import { type ImageResultItem } from "@/components/shared/ImageResultList";
import { createToolTracker } from "@/lib/analytics";

const tracker = createToolTracker("add-text", "image");

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

interface ExportPanelProps {
  baseFilename: string;
  onResult: (item: ImageResultItem) => void;
}

export function ExportPanel({ baseFilename, onResult }: ExportPanelProps) {
  const { state } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const [processing, setProcessing] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.92);

  const canExport =
    state.imageBitmap !== null &&
    state.imageNaturalSize !== null &&
    state.layers.length > 0;

  async function handleExport() {
    if (!canExport || !state.imageBitmap || !state.imageNaturalSize) return;
    setProcessing(true);
    const start = Date.now();
    try {
      const blob = await exportImage(
        state.imageBitmap,
        state.imageNaturalSize,
        state.layers,
        { format, quality },
      );
      const ext = format === "jpeg" ? "jpg" : format;
      onResult({ blob, filename: `text_${baseFilename}.${ext}` });
      tracker.trackProcessComplete(Date.now() - start);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      tracker.trackProcessError(msg);
      console.error(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium">{t("format")}</label>
        <div className="flex gap-1">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={`flex-1 rounded border px-2 py-1.5 text-xs ${
                format === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {format !== "png" && (
        <div>
          <label className="mb-1 block text-xs font-medium">
            {t("quality")}: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <Button onClick={handleExport} disabled={!canExport || processing} className="w-full">
        <Download className="mr-1 h-4 w-4" />
        {processing ? t("exporting") : t("exportImage")}
      </Button>
    </div>
  );
}
