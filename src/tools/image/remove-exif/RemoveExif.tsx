"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Aperture,
  Braces,
  Calendar,
  Camera,
  FileText,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import {
  ALL_CATEGORIES,
  NONE_CATEGORIES,
  isAllSelected,
  isNoneSelected,
  removeExif,
  type RemoveExifCategory,
  type RemoveExifOptions,
} from "./logic";

const CATEGORY_LIST: { key: RemoveExifCategory; icon: typeof MapPin }[] = [
  { key: "gps", icon: MapPin },
  { key: "cameraLens", icon: Camera },
  { key: "shooting", icon: Aperture },
  { key: "dateTime", icon: Calendar },
  { key: "author", icon: User },
  { key: "description", icon: FileText },
  { key: "thumbnail", icon: ImageIcon },
  { key: "xmp", icon: Braces },
];

const UNSUPPORTED_SELECTIVE = new Set(["image/avif", "image/heic"]);

const tracker = createToolTracker("remove-exif", "image");

export default function RemoveExif() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [options, setOptions] = useState<RemoveExifOptions>(ALL_CATEGORIES);
  const t = useTranslations("tools.image.remove-exif");

  const allSelected = isAllSelected(options);
  const noneSelected = isNoneSelected(options);
  const hasUnsupportedFormat = useMemo(
    () => files.some((f) => UNSUPPORTED_SELECTIVE.has(f.type)),
    [files],
  );

  function toggleCategory(key: RemoveExifCategory): void {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleProcess() {
    if (files.length === 0 || noneSelected) return;
    const started = performance.now();
    setProcessing(true);
    setResults([]);
    setProgress({ done: 0, total: files.length });
    setError("");

    for (const file of files) {
      try {
        const r = await removeExif(file, options);
        const item: ImageResultItem = {
          blob: r.cleaned,
          filename: r.outputFilename,
        };
        setResults((prev) => [...prev, item]);
      } catch (e) {
        console.error(`EXIF removal failed for ${file.name}:`, e);
        const msg = e instanceof Error ? e.message : String(e);
        setError((prev) =>
          prev ? `${prev}\n${file.name}: ${msg}` : `${file.name}: ${msg}`,
        );
        tracker.trackProcessError(msg);
      }
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    setProcessing(false);
    tracker.trackProcessComplete(Math.round(performance.now() - started));
  }

  return (
    <div className="space-y-4">
      <ImageFileGrid
        files={files}
        onFilesChange={setFiles}
        disabled={processing}
      />

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">{t("categoryTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("categoryHint")}</p>
          </div>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setOptions(ALL_CATEGORIES)}
              className="text-primary hover:underline disabled:opacity-50"
              disabled={processing || allSelected}
            >
              {t("selectAll")}
            </button>
            <button
              type="button"
              onClick={() => setOptions(NONE_CATEGORIES)}
              className="text-muted-foreground hover:underline disabled:opacity-50"
              disabled={processing || noneSelected}
            >
              {t("selectNone")}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_LIST.map(({ key, icon: Icon }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggleCategory(key)}
                disabled={processing}
                className="h-4 w-4 accent-primary"
              />
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{t(`categories.${key}`)}</span>
            </label>
          ))}
        </div>
        {hasUnsupportedFormat && !allSelected && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t("avifNotice")}
          </p>
        )}
        {noneSelected && (
          <p className="text-xs text-destructive">{t("noSelection")}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleProcess}
          disabled={files.length === 0 || processing || noneSelected}
        >
          {processing ? t("processing") : t("removeExif")}
        </Button>
        {processing && (
          <span className="text-sm text-muted-foreground">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </pre>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <ShieldCheck className="h-4 w-4" />
            {t("cleaned")}
          </div>
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
