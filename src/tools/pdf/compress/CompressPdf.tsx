"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import { compressPdf, formatFileSize, type PdfQuality } from "./logic";

const tracker = createToolTracker("compress", "pdf");

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [quality, setQuality] = useState<PdfQuality>("medium");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.compress");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setProgress({ current: 0, total: 0 });
    setPageCount(null);
    setThumbnail(null);
    try {
      const { pageCount: pc, thumbnail: thumb } = await getPdfPreview(f);
      setPageCount(pc);
      setThumbnail(thumb);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleRemoveFile() {
    setFile(null);
    setPageCount(null);
    setThumbnail(null);
    setResult(null);
    setError("");
    setProgress({ current: 0, total: 0 });
  }

  async function handleCompress() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    setProgress({ current: 0, total: 0 });
    const t0 = performance.now();
    try {
      const blob = await compressPdf(file, quality, (current, total) => {
        setProgress({ current, total });
      });
      setResult(blob);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Compress failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file && <FileDropzone accept="application/pdf" onFiles={handleFile} />}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {file && (
        <div className="space-y-4">
          <PdfFilePreview
            file={file}
            pageCount={pageCount}
            thumbnail={thumbnail}
            disabled={processing}
            onReplace={(f) => void handleFile([f])}
            onRemove={handleRemoveFile}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("quality")}</label>
            <div className="flex gap-4">
              {(["high", "medium", "low"] as PdfQuality[]).map((q) => (
                <label key={q} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={quality === q}
                    onChange={() => {
                      setQuality(q);
                      setResult(null);
                    }}
                  />
                  {t(q)}
                </label>
              ))}
            </div>
          </div>

          {processing && progress.total > 0 && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("compressing")} {progress.current}/{progress.total} {t("pages")}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={handleCompress} disabled={processing}>
              {processing ? t("compressing") : t("compress")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={file.name.replace(/\.pdf$/i, "_compressed.pdf")}
              />
            )}
          </div>

          {result && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <p>
                {t("originalSize")}: {formatFileSize(file.size)}
              </p>
              <p>
                {t("compressedSize")}: {formatFileSize(result.size)}
              </p>
              <p>
                {t("saved")}:{" "}
                {file.size > result.size
                  ? `${(((file.size - result.size) / file.size) * 100).toFixed(1)}%`
                  : t("noReduction")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
