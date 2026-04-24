"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/Button";
import { Download, FileJson, FileSpreadsheet, X, RefreshCw, Save } from "lucide-react";
import { createToolTracker } from "@/lib/analytics";
import { brandFilename } from "@/lib/brand";
import { formatFileSize } from "@/lib/utils/formatFileSize";
import type { EditableFields, ExifRecord } from "./types";
import {
  editableFieldsFromRecord,
  emptyEditableFields,
} from "./types";
import { readExif } from "./logic/readExif";
import { writeExif, editedFilename } from "./logic/writeExif";
import { exportJson, jsonFilename } from "./logic/exportJson";
import { exportCsv, csvFilename } from "./logic/exportCsv";
import { ExifPanel } from "./components/ExifPanel";

const tracker = createToolTracker("exif-editor", "image");

export default function ExifEditor() {
  const t = useTranslations("tools.image.exif-editor");
  const [file, setFile] = useState<File | null>(null);
  const [record, setRecord] = useState<ExifRecord | null>(null);
  const [edits, setEdits] = useState<EditableFields>(emptyEditableFields());
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [lastDownload, setLastDownload] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setThumbnailUrl(null);
      setDimensions(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setThumbnailUrl(url);
    const img = new Image();
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) {
      setRecord(null);
      setEdits(emptyEditableFields());
      return;
    }
    let cancelled = false;
    setError("");
    setLastDownload(null);
    (async () => {
      try {
        const r = await readExif(file);
        if (cancelled) return;
        setRecord(r);
        setEdits(editableFieldsFromRecord(r));
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        tracker.trackProcessError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleUpload = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setError("");
    setLastDownload(null);
  }, []);

  const handleReset = useCallback(() => {
    if (record) setEdits(editableFieldsFromRecord(record));
    setError("");
  }, [record]);

  const clearGps = useCallback(() => {
    setEdits((p) => ({ ...p, gpsLatitude: "", gpsLongitude: "" }));
  }, []);

  const clearDateTime = useCallback(() => {
    setEdits((p) => ({ ...p, dateTimeOriginal: "" }));
  }, []);

  const handleApply = useCallback(async () => {
    if (!file || !record?.writeable) return;
    setProcessing(true);
    setError("");
    setLastDownload(null);
    const start = performance.now();
    try {
      const blob = await writeExif(file, edits);
      const filename = editedFilename(file);
      triggerDownload(blob, filename);
      setLastDownload(filename);
      tracker.trackProcessComplete(Math.round(performance.now() - start));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      tracker.trackProcessError(msg);
    } finally {
      setProcessing(false);
    }
  }, [file, record, edits]);

  const handleExportJson = useCallback(() => {
    if (!record) return;
    triggerDownload(exportJson(record), jsonFilename(record));
  }, [record]);

  const handleExportCsv = useCallback(() => {
    if (!record) return;
    triggerDownload(exportCsv(record), csvFilename(record));
  }, [record]);

  if (!file) {
    return (
      <FileDropzone
        accept="image/*,.heic,.heif,.avif,.tif,.tiff"
        multiple={false}
        onFiles={handleUpload}
        analyticsSlug="exif-editor"
        analyticsCategory="image"
      />
    );
  }

  return (
    <div className="space-y-3">
      <FileInfoBar
        file={file}
        thumbnailUrl={thumbnailUrl}
        dimensions={dimensions}
        onRemove={handleRemove}
        disabled={processing}
      />

      {record ? (
        <ExifPanel
          record={record}
          edits={edits}
          onEditsChange={setEdits}
          onClearGps={clearGps}
          onClearDateTime={clearDateTime}
          processing={processing}
        />
      ) : !error ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {t("messages.loadingExif")}
        </div>
      ) : null}

      {error && (
        <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </pre>
      )}

      {record && (
        <ActionBar
          writable={record.writeable}
          processing={processing}
          onApply={handleApply}
          onReset={handleReset}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          lastDownload={lastDownload}
        />
      )}
    </div>
  );
}

function FileInfoBar({
  file,
  thumbnailUrl,
  dimensions,
  onRemove,
  disabled,
}: {
  file: File;
  thumbnailUrl: string | null;
  dimensions: { w: number; h: number } | null;
  onRemove: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("tools.image.exif-editor");
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={file.name}
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-md bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {dimensions
            ? `${dimensions.w}×${dimensions.h} · ${formatFileSize(file.size)}`
            : formatFileSize(file.size)}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        title={t("actions.removeFile")}
      >
        <X className="h-3.5 w-3.5" />
        {t("actions.changeFile")}
      </Button>
    </div>
  );
}

function ActionBar({
  writable,
  processing,
  onApply,
  onReset,
  onExportJson,
  onExportCsv,
  lastDownload,
}: {
  writable: boolean;
  processing: boolean;
  onApply: () => void;
  onReset: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  lastDownload: string | null;
}) {
  const t = useTranslations("tools.image.exif-editor");
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
      {writable && (
        <>
          <Button onClick={onApply} disabled={processing}>
            <Save className="h-4 w-4" />
            {processing ? t("messages.processing") : t("actions.applyEdits")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={processing}
            title={t("actions.resetEdits")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("actions.resetEdits")}
          </Button>
        </>
      )}
      <div className="ml-auto flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onExportJson} disabled={processing}>
          <FileJson className="h-3.5 w-3.5" />
          {t("actions.exportJson")}
        </Button>
        <Button variant="outline" size="sm" onClick={onExportCsv} disabled={processing}>
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {t("actions.exportCsv")}
        </Button>
      </div>
      {lastDownload && (
        <div className="flex w-full items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Download className="h-3 w-3" />
          {t("messages.writeSuccess")} — {lastDownload}
        </div>
      )}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = brandFilename(filename);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
