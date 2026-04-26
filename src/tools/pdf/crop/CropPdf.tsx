"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { cropPdf, formatFileSize, type CropMargins } from "./logic";

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [margins, setMargins] = useState<CropMargins>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.crop");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setPageCount(0);
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
    setPageCount(0);
    setThumbnail(null);
    setResult(null);
    setError("");
  }

  function updateMargin(key: keyof CropMargins, value: string) {
    const num = parseFloat(value);
    // Allow clearing to 0, reject negative and non-numeric
    setMargins((prev) => ({ ...prev, [key]: isNaN(num) || num < 0 ? 0 : num }));
    setResult(null);
  }

  async function handleApply() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await cropPdf(file, margins);
      setResult(blob);
    } catch (e) {
      console.error("Crop failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  const hasMargins =
    margins.top > 0 ||
    margins.bottom > 0 ||
    margins.left > 0 ||
    margins.right > 0;

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
            pageCount={pageCount > 0 ? pageCount : null}
            thumbnail={thumbnail}
            disabled={processing}
            onReplace={(f) => void handleFile([f])}
            onRemove={handleRemoveFile}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("margins")}</label>
            <p className="text-xs text-muted-foreground">{t("marginsHint")}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["top", "bottom", "left", "right"] as const).map((side) => (
                <div key={side} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {t(side)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={margins[side]}
                    onChange={(e) => updateMargin(side, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleApply}
              disabled={processing || !hasMargins}
            >
              {processing ? t("processing") : t("apply")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={file.name.replace(/\.pdf$/i, "_cropped.pdf")}
              />
            )}
          </div>

          {result && (
            <p className="text-sm text-muted-foreground">
              {formatFileSize(result.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
