"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { X, Plus, Link2, Link2Off } from "lucide-react";
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
];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
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
  const [previews, setPreviews] = useState<string[]>([]);
  const [addDragging, setAddDragging] = useState(false);
  const t = useTranslations("tools.image.compress");
  const addInputRef = useRef<HTMLInputElement>(null);

  // Ref tracks latest previews for unmount cleanup
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleFiles(newFiles: File[]) {
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newUrls]);
    if (newFiles.length > 0) {
      getImageDimensions(newFiles[0])
        .then((dims) => {
          setOriginalWidth(dims.width);
          setOriginalHeight(dims.height);
          setCustomWidth((prev) => (prev === 0 ? dims.width : prev));
          setCustomHeight((prev) => (prev === 0 ? dims.height : prev));
        })
        .catch(() => {});
    }
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

  function removeFile(index: number) {
    setAddDragging(false);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearFiles() {
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setFiles([]);
  }

  const isCustom = preset === "custom";
  const isPngOutput = outputFormat === "image/png";

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <FileDropzone
          accept="image/*"
          multiple
          onFiles={handleFiles}
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted/30"
            >
              <div className="aspect-square">
                <img
                  src={previews[i]}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                disabled={compressing}
                className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:hidden"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div
            role="button"
            tabIndex={compressing ? -1 : 0}
            aria-disabled={compressing}
            onClick={() => { if (!compressing) addInputRef.current?.click(); }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !compressing) {
                e.preventDefault();
                addInputRef.current?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); if (!compressing) setAddDragging(true); }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setAddDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setAddDragging(false);
              if (compressing) return;
              const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
              if (dropped.length > 0) handleFiles(dropped);
            }}
            className={`group/add overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 ${
              compressing
                ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
                : addDragging
                  ? "cursor-pointer border-primary bg-primary/10 text-primary shadow-[var(--glow-primary)]"
                  : "cursor-pointer border-primary/30 bg-primary/[0.03] text-primary/70 hover:border-primary/60 hover:bg-primary/[0.07] hover:text-primary"
            }`}
          >
            <div className="aspect-square flex flex-col items-center justify-center px-2">
              <div className="rounded-full bg-primary/10 p-2 group-hover/add:bg-primary/15 transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <span className="mt-1.5 text-xs font-medium">{t("addMore")}</span>
              <span className="mt-0.5 text-[10px] opacity-50">{t("addMoreHint")}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFiles}
            disabled={compressing}
            className="group/del cursor-pointer overflow-hidden rounded-lg border border-dashed border-red-300/30 bg-red-50/30 text-red-400/60 hover:border-red-400/60 hover:bg-red-50/60 hover:text-red-500 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-500/40 dark:hover:border-red-700/50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="aspect-square flex flex-col items-center justify-center px-2">
              <div className="rounded-full bg-red-100/60 p-2 group-hover/del:bg-red-100 dark:bg-red-900/30 dark:group-hover/del:bg-red-900/50 transition-colors">
                <X className="h-5 w-5" />
              </div>
              <span className="mt-1.5 text-xs font-medium">{t("clearAll")}</span>
            </div>
          </button>
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      )}

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
