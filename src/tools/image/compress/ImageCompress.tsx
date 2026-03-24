"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Link2, Link2Off } from "lucide-react";
import {
  compressImage,
  formatFileSize,
  RESOLUTION_PRESETS,
  COMPRESSION_PRESETS,
  type PresetKey,
  type OutputFormat,
  type CompressOptions,
} from "./logic";

const PRESET_KEYS: PresetKey[] = [
  "high-quality",
  "balanced",
  "small-file",
  "custom",
];

const FORMAT_OPTIONS: { key: string; value: OutputFormat }[] = [
  { key: "original", value: "original" },
  { key: "jpeg", value: "image/jpeg" },
  { key: "png", value: "image/png" },
  { key: "webp", value: "image/webp" },
  { key: "avif", value: "image/avif" },
];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export default function ImageCompress() {
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState<PresetKey>("balanced");
  const [quality, setQuality] = useState(75);
  const [maxSize, setMaxSize] = useState(1);
  const [maxResolution, setMaxResolution] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [preserveExif, setPreserveExif] = useState(false);
  const [customWidth, setCustomWidth] = useState(0);
  const [customHeight, setCustomHeight] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.compress");
  const prevFilesLenRef = useRef(0);

  function handleFilesChange(newFiles: File[]) {
    if (newFiles.length === 0) {
      // Reset dimension state when all files are cleared
      setOriginalWidth(0);
      setOriginalHeight(0);
      setCustomWidth(0);
      setCustomHeight(0);
    } else if (newFiles.length > prevFilesLenRef.current) {
      // Detect newly added files for dimension reading
      const firstNew = newFiles[prevFilesLenRef.current];
      getImageDimensions(firstNew)
        .then((dims) => {
          setOriginalWidth(dims.width);
          setOriginalHeight(dims.height);
          setCustomWidth((prev) => (prev === 0 ? dims.width : prev));
          setCustomHeight((prev) => (prev === 0 ? dims.height : prev));
        })
        .catch(() => {});
    }
    prevFilesLenRef.current = newFiles.length;
    setFiles(newFiles);
  }

  function applyPreset(key: PresetKey) {
    setPreset(key);
    if (key !== "custom") {
      const p = COMPRESSION_PRESETS[key];
      setQuality(p.quality);
      setMaxSize(p.maxSizeMB);
      setMaxResolution(p.maxWidthOrHeight);
    }
  }

  function handleWidth(w: number) {
    setCustomWidth(w);
    if (lockRatio && originalWidth > 0 && w > 0) {
      setCustomHeight(Math.round((w / originalWidth) * originalHeight));
    }
  }

  function handleHeight(h: number) {
    setCustomHeight(h);
    if (lockRatio && originalHeight > 0 && h > 0) {
      setCustomWidth(Math.round((h / originalHeight) * originalWidth));
    }
  }

  function getOutputFilename(originalName: string, format: OutputFormat): string {
    if (format === "original") return originalName;
    const ext = MIME_TO_EXT[format] ?? format.split("/")[1];
    return /\.[^.]+$/.test(originalName)
      ? originalName.replace(/\.[^.]+$/, `.${ext}`)
      : `${originalName}.${ext}`;
  }

  async function handleCompress() {
    if (files.length === 0) return;

    setCompressing(true);
    setError("");
    setResults([]);
    setProgress({ done: 0, total: files.length });
    const options: CompressOptions = {
      quality,
      maxSizeMB: maxSize,
      maxWidthOrHeight: maxResolution,
      outputFormat,
      preserveExif,
      ...(preset === "custom" && customWidth > 0 && customHeight > 0
        ? { customWidth, customHeight }
        : {}),
    };

    for (const f of files) {
      try {
        const r = await compressImage(f, options);
        const savingsText =
          r.savings > 0 ? `-${r.savings}%` : `+${Math.abs(r.savings)}%`;
        const item: ImageResultItem = {
          blob: r.compressed,
          filename: getOutputFilename(r.original.name, outputFormat),
          meta: `${formatFileSize(r.originalSize)} → ${formatFileSize(r.compressedSize)} (${savingsText})`,
        };
        setResults((prev) => [...prev, item]);
      } catch (e) {
        console.error(`Compression failed for ${f.name}:`, e);
        setError((prev) =>
          prev
            ? `${prev}\n${f.name}: ${e instanceof Error ? e.message : String(e)}`
            : `${f.name}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    setCompressing(false);
  }

  const isCustom = preset === "custom";
  const isPngOutput = outputFormat === "image/png";

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={handleFilesChange}
        disabled={compressing}
      />

      {/* Compression Presets */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">{t("preset.label")}</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                preset === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {t(`preset.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings (Custom preset only) */}
      {isCustom && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h4 className="text-sm font-medium">{t("advancedSettings")}</h4>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("quality")}: {quality}%
                {isPngOutput && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({t("pngNote")})
                  </span>
                )}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-40 cursor-pointer"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("maxSize")}: {maxSize} MB
              </label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                className="w-40 cursor-pointer"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("maxResolution")}
              </label>
              <Select
                value={String(maxResolution)}
                onChange={(e) => setMaxResolution(Number(e.target.value))}
              >
                {RESOLUTION_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              {t("customDimensions")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={customWidth || ""}
                onChange={(e) => handleWidth(Number(e.target.value))}
                placeholder={t("width")}
                className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
              <span className="text-muted-foreground">×</span>
              <input
                type="number"
                min={1}
                value={customHeight || ""}
                onChange={(e) => handleHeight(Number(e.target.value))}
                placeholder={t("height")}
                className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={lockRatio ? t("unlockRatio") : t("lockRatio")}
              >
                {lockRatio ? (
                  <Link2 className="h-4 w-4" />
                ) : (
                  <Link2Off className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output Format */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">{t("outputFormat")}</label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.key}
              type="button"
              onClick={() => setOutputFormat(fmt.value)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                outputFormat === fmt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {t(`format.${fmt.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Preserve EXIF */}
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={preserveExif}
          onChange={(e) => setPreserveExif(e.target.checked)}
          className="cursor-pointer rounded border-border"
        />
        {t("preserveExif")}
      </label>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleCompress}
          disabled={files.length === 0 || compressing}
        >
          {compressing ? t("compressing") : t("compress")}
        </Button>
        {compressing && (
          <span className="text-sm text-muted-foreground">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("results")}</h3>
          <ImageResultList
            results={results}
            onRemove={(i) =>
              setResults((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </div>
      )}
    </div>
  );
}
