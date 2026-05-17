"use client";

import { useTranslations } from "next-intl";
import { useWatermark } from "../WatermarkContext";
import type { OutputFormat } from "../lib/config";

const FORMATS: { value: OutputFormat; labelKey: string }[] = [
  { value: "original", labelKey: "formatOriginal" },
  { value: "jpeg", labelKey: "formatJpeg" },
  { value: "png", labelKey: "formatPng" },
  { value: "webp", labelKey: "formatWebp" },
];

export function OutputControls() {
  const { output, setOutput } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const showQuality = output.format === "jpeg" || output.format === "webp";

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">{t("outputFormat")}</label>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setOutput((prev) => ({ ...prev, format: f.value }))}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                output.format === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {showQuality && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("quality")}: {Math.round(output.quality * 100)}%
          </label>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            value={output.quality}
            onChange={(e) =>
              setOutput((prev) => ({
                ...prev,
                quality: Number(e.target.value),
              }))
            }
            className="w-full cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
