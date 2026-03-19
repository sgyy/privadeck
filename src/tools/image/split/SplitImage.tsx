"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { splitImage, downloadAsZip } from "./logic";

export default function SplitImage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.split");

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    setZipBlob(null);
    setError("");
  }

  async function handleSplit() {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const pieces = await splitImage(file, rows, cols);
      const items: ImageResultItem[] = pieces.map((p) => ({
        blob: p.blob,
        filename: p.filename,
        meta: `${rows}x${cols} grid`,
      }));
      setResults(items);

      const zip = await downloadAsZip(pieces);
      setZipBlob(zip);
    } catch (e) {
      console.error("Split failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/*" onFiles={handleFile} />

      {file && (
        <>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            {file.name}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("rows")}
              </label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(5, Number(e.target.value))))}
                min={1}
                max={5}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("columns")}
              </label>
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(5, Number(e.target.value))))}
                min={1}
                max={5}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button onClick={handleSplit} disabled={processing}>
              {processing ? t("processing") : t("split")}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {zipBlob && (
                <DownloadButton
                  data={zipBlob}
                  filename={`${file.name.replace(/\.[^.]+$/, "")}_split.zip`}
                />
              )}

              <ImageResultList
                results={results}
                onRemove={(i) =>
                  setResults((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
