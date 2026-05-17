"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFileGrid } from "@/components/shared/ImageFileGrid";
import { Button } from "@/components/ui/Button";
import { brandFilename } from "@/lib/brand";
import { createToolTracker } from "@/lib/analytics";
import { downloadAsZip } from "@/tools/image/split/logic";
import { useWatermark } from "../WatermarkContext";
import { OutputControls } from "../components/OutputControls";
import {
  exportWatermark,
  extForMime,
  resolveMime,
} from "../lib/exportWatermark";

const tracker = createToolTracker("watermark", "image");

type FileStatus = "pending" | "processing" | "done" | "error";
interface FileState {
  status: FileStatus;
  message?: string;
}

export function BatchTab() {
  const { config, output, addResult } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const [files, setFiles] = useState<File[]>([]);
  const [statusMap, setStatusMap] = useState<Map<File, FileState>>(new Map());
  const [processing, setProcessing] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipError, setZipError] = useState("");

  const hasWatermark =
    config.mode === "text"
      ? config.text.text.trim().length > 0
      : config.image.bitmap !== null;

  function handleFilesChange(next: File[]) {
    setFiles(next);
    // Drop status entries for removed files; keep surviving ones.
    setStatusMap((prev) => {
      const map = new Map<File, FileState>();
      for (const f of next) {
        const s = prev.get(f);
        if (s) map.set(f, s);
      }
      return map;
    });
  }

  function setStatus(file: File, status: FileStatus, message?: string) {
    setStatusMap((prev) => {
      const map = new Map(prev);
      map.set(file, { status, message });
      return map;
    });
  }

  async function handleProcess() {
    if (files.length === 0 || processing) return;
    setProcessing(true);
    setZipError("");
    setStatusMap(new Map(files.map((f) => [f, { status: "pending" }])));

    for (const file of files) {
      const t0 = performance.now();
      let bmp: ImageBitmap | null = null;
      setStatus(file, "processing");
      try {
        bmp = await createImageBitmap(file);
        const naturalSize = { w: bmp.width, h: bmp.height };
        const blob = await exportWatermark(
          bmp,
          naturalSize,
          config,
          output,
          file.type,
        );
        const mime = resolveMime(output, file.type);
        const ext = extForMime(mime);
        const base = file.name.replace(/\.[^.]+$/, "");
        const filename = `watermarked_${base}.${ext}`;
        addResult({ blob, filename, meta: `${naturalSize.w}×${naturalSize.h}` });
        tracker.trackProcessComplete(Math.round(performance.now() - t0));
        setStatus(file, "done");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        setStatus(file, "error", msg);
      } finally {
        bmp?.close();
      }
    }

    setProcessing(false);
  }

  async function handleZip() {
    if (zipBusy) return;
    setZipBusy(true);
    setZipError("");
    try {
      // Re-render every file to a fresh blob for the archive so the ZIP is
      // self-contained regardless of which results the user kept/removed.
      const pieces: { blob: Blob; filename: string }[] = [];
      for (const file of files) {
        let bmp: ImageBitmap | null = null;
        try {
          bmp = await createImageBitmap(file);
          const naturalSize = { w: bmp.width, h: bmp.height };
          const blob = await exportWatermark(
            bmp,
            naturalSize,
            config,
            output,
            file.type,
          );
          const mime = resolveMime(output, file.type);
          const base = file.name.replace(/\.[^.]+$/, "");
          pieces.push({
            blob,
            filename: `watermarked_${base}.${extForMime(mime)}`,
          });
        } catch (e) {
          // One bad file (corrupt, unsupported, or a logo swapped mid-run)
          // must not abort the whole archive — flag it and keep going.
          const msg = e instanceof Error ? e.message : String(e);
          setStatus(file, "error", msg);
        } finally {
          bmp?.close();
        }
      }
      if (pieces.length === 0) return;
      const zip = await downloadAsZip(pieces);
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url;
      a.download = brandFilename("watermarked_images.zip");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setZipError(e instanceof Error ? e.message : String(e));
    } finally {
      setZipBusy(false);
    }
  }

  const statusLabel: Record<FileStatus, string> = {
    pending: t("statusPending"),
    processing: t("processing"),
    done: t("statusDone"),
    error: t("statusError"),
  };
  const statusClass: Record<FileStatus, string> = {
    pending: "text-muted-foreground",
    processing: "text-primary",
    done: "text-emerald-600 dark:text-emerald-400",
    error: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("batchHint")}</p>

      <ImageFileGrid
        files={files}
        onFilesChange={handleFilesChange}
        disabled={processing || zipBusy}
      />

      <OutputControls />

      {!hasWatermark && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t("batchNeedsWatermark")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleProcess}
          disabled={files.length === 0 || !hasWatermark || processing || zipBusy}
        >
          {processing ? t("processing") : t("addToResults")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleZip}
          disabled={
            files.length === 0 || !hasWatermark || processing || zipBusy
          }
        >
          {zipBusy ? t("processing") : t("downloadZip")}
        </Button>
      </div>

      {statusMap.size > 0 && (
        <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-border p-1 text-xs">
          {files.map((file, i) => {
            const s = statusMap.get(file);
            if (!s) return null;
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-3 px-2 py-1"
              >
                <span className="truncate">{file.name}</span>
                <span
                  className={`flex-shrink-0 font-medium ${statusClass[s.status]}`}
                  title={s.message}
                >
                  {s.status === "error" && s.message
                    ? `${statusLabel.error} · ${s.message}`
                    : statusLabel[s.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {zipError && (
        <p className="text-sm text-red-600 dark:text-red-400">{zipError}</p>
      )}
    </div>
  );
}
