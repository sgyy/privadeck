"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { useWatermark } from "../WatermarkContext";
import type { WatermarkConfig } from "../lib/config";

export function ImageWatermarkControls() {
  const { config, setConfig } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const tc = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const image = config.image;

  const patchTransform = (patch: Partial<WatermarkConfig["transform"]>) =>
    setConfig((prev) => ({
      ...prev,
      transform: { ...prev.transform, ...patch },
    }));

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const bmp = await createImageBitmap(file);
      setConfig((prev) => ({
        ...prev,
        image: {
          bitmap: bmp,
          sourceName: file.name,
          widthNorm: prev.image.widthNorm,
          aspectRatio: bmp.width / Math.max(1, bmp.height),
        },
      }));
    } catch {
      setError(t("errLogo"));
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/webp,image/svg+xml,image/*"
          className="hidden"
          onChange={(e) => {
            handleLogo(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label={image.bitmap ? t("replaceLogo") : t("uploadLogo")}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (
              !(e.relatedTarget instanceof Node) ||
              !e.currentTarget.contains(e.relatedTarget)
            ) {
              setDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = Array.from(e.dataTransfer.files);
            handleLogo(
              dropped.find((f) => f.type.startsWith("image/")) ?? dropped[0],
            );
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {image.bitmap ? t("replaceLogo") : t("uploadLogo")}
          </span>
          <span className="text-xs text-muted-foreground">
            {tc("or")} {tc("dragDrop").toLowerCase()}
          </span>
          {image.sourceName && (
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {image.sourceName}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{t("logoHint")}</p>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {image.bitmap && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("logoWidth")}: {Math.round(image.widthNorm * 100)}%
            </label>
            <input
              type="range"
              min={0.02}
              max={1}
              step={0.01}
              value={image.widthNorm}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  image: {
                    ...prev.image,
                    widthNorm: Number(e.target.value),
                  },
                }))
              }
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("opacity")}: {Math.round(config.transform.opacity * 100)}%
            </label>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={config.transform.opacity}
              onChange={(e) =>
                patchTransform({ opacity: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              {t("rotation")}: {Math.round(config.transform.rotationDeg)}°
            </label>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={config.transform.rotationDeg}
              onChange={(e) =>
                patchTransform({ rotationDeg: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
