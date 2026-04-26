"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { RotateCw, RotateCcw } from "lucide-react";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { rotatePdf, formatFileSize } from "./logic";

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [rotation, setRotation] = useState(90);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.rotate");

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

  async function handleRotate() {
    if (!file || pageCount === 0) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      // Apply same rotation to all pages
      const rotations: Record<number, number> = {};
      for (let i = 0; i < pageCount; i++) {
        rotations[i] = rotation;
      }
      const blob = await rotatePdf(file, rotations);
      setResult(blob);
    } catch (e) {
      console.error("Rotation failed:", e);
      setError(String(e instanceof Error ? e.message : e));
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
        <>
          <PdfFilePreview
            file={file}
            pageCount={pageCount > 0 ? pageCount : null}
            thumbnail={thumbnail}
            disabled={processing}
            onReplace={(f) => void handleFile([f])}
            onRemove={handleRemoveFile}
          />

          {pageCount > 0 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{t("direction")}</span>
                  <div className="flex gap-2">
                    <Button
                      variant={rotation === 90 ? "primary" : "outline"}
                      onClick={() => { setRotation(90); setResult(null); }}
                    >
                      <RotateCw className="mr-1.5 h-4 w-4" />
                      {t("clockwise")}
                    </Button>
                    <Button
                      variant={rotation === 270 ? "primary" : "outline"}
                      onClick={() => { setRotation(270); setResult(null); }}
                    >
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      {t("counterClockwise")}
                    </Button>
                    <Button
                      variant={rotation === 180 ? "primary" : "outline"}
                      onClick={() => { setRotation(180); setResult(null); }}
                    >
                      180°
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={handleRotate} disabled={processing}>
                  {processing ? t("rotating") : t("rotateAll")}
                </Button>
                {result && (
                  <DownloadButton
                    data={result}
                    filename={file.name.replace(/\.pdf$/i, "_rotated.pdf")}
                  />
                )}
              </div>

              {result && (
                <p className="text-sm text-muted-foreground">
                  {t("resultSize")}: {formatFileSize(result.size)}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
