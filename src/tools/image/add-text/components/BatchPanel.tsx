"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Wand2 } from "lucide-react";
import { useEditor } from "../EditorContext";
import { exportImage, type ExportFormat } from "../lib/exporter";
import type { TextLayer } from "../lib/reducer";

interface QueueItem {
  file: File;
  status: "pending" | "processing" | "done" | "error";
  message?: string;
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

function scaleLayersToImage(
  layers: TextLayer[],
  templateWidth: number,
  targetWidth: number,
  scaleFonts: boolean,
): TextLayer[] {
  if (!scaleFonts || templateWidth === 0) return layers;
  const ratio = targetWidth / templateWidth;
  return layers.map((layer) => ({
    ...layer,
    fontSizePx: Math.max(8, Math.round(layer.fontSizePx * ratio)),
    strokeWidth: Math.max(0, layer.strokeWidth * ratio),
    shadowBlur: Math.max(0, layer.shadowBlur * ratio),
    shadowOffsetX: layer.shadowOffsetX * ratio,
    shadowOffsetY: layer.shadowOffsetY * ratio,
    bgPaddingX: layer.bgPaddingX * ratio,
    bgPaddingY: layer.bgPaddingY * ratio,
    bgRadius: layer.bgRadius * ratio,
    letterSpacing: layer.letterSpacing * ratio,
  }));
}

interface BatchPanelProps {
  onResult: (item: ImageResultItem) => void;
}

export function BatchPanel({ onResult }: BatchPanelProps) {
  const { state } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [scaleFonts, setScaleFonts] = useState(true);

  function handleFiles(files: File[]) {
    setQueue((prev) => [
      ...prev,
      ...files.map((file) => ({ file, status: "pending" as const })),
    ]);
  }

  async function handleApplyAll() {
    if (queue.length === 0 || state.layers.length === 0) return;
    setProcessing(true);
    const templateWidth = state.imageNaturalSize?.w ?? 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== "pending") continue;
      setQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, status: "processing" } : q)),
      );
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(item.file);
        const naturalSize = { w: bitmap.width, h: bitmap.height };
        const scaledLayers = scaleLayersToImage(
          state.layers,
          templateWidth,
          naturalSize.w,
          scaleFonts,
        );
        const blob = await exportImage(bitmap, naturalSize, scaledLayers, {
          format,
          quality,
        });
        const baseName = item.file.name.replace(/\.[^.]+$/, "") || "image";
        const ext = format === "jpeg" ? "jpg" : format;
        onResult({ blob, filename: `text_${baseName}.${ext}` });
        setQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: "done" } : q)),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed";
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i ? { ...q, status: "error", message } : q,
          ),
        );
      } finally {
        bitmap?.close();
      }
    }
    setProcessing(false);
  }

  function clearQueue() {
    setQueue([]);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("batchHint")}</p>

      {!processing && (
        <FileDropzone accept="image/*" onFiles={handleFiles} multiple />
      )}

      {queue.length > 0 && (
        <div className="space-y-2">
          <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded border border-border text-xs">
            {queue.map((item, i) => (
              <li
                key={`${item.file.name}-${i}`}
                className="flex items-center justify-between px-2 py-1"
              >
                <span className="truncate">{item.file.name}</span>
                <span
                  className={
                    item.status === "done"
                      ? "text-green-600"
                      : item.status === "error"
                      ? "text-red-600"
                      : item.status === "processing"
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }
                >
                  {item.status === "done" ? "✓" : item.status}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex gap-1">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={`flex-1 rounded border px-2 py-1 text-xs ${
                  format === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {format !== "png" && (
            <div>
              <label className="mb-1 block text-xs">
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

          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={scaleFonts}
              onChange={(e) => setScaleFonts(e.target.checked)}
            />
            {t("scaleText")}
          </label>

          <div className="flex gap-2">
            <Button
              onClick={handleApplyAll}
              disabled={processing || state.layers.length === 0}
              className="flex-1"
            >
              <Wand2 className="mr-1 h-4 w-4" />
              {processing ? t("processing") : t("applyToAll")}
            </Button>
            <Button variant="outline" onClick={clearQueue} disabled={processing}>
              {t("clear")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
