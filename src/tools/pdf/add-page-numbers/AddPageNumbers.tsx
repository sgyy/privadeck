"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import {
  addPageNumbers,
  formatFileSize,
  type NumberPosition,
  type NumberFormat,
} from "./logic";

const POSITIONS: NumberPosition[] = [
  "bottom-center",
  "bottom-left",
  "bottom-right",
  "top-center",
  "top-left",
  "top-right",
];

const FORMATS: NumberFormat[] = ["number", "pageN", "nOfTotal"];

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState<NumberFormat>("number");
  const [startPage, setStartPage] = useState(1);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.add-page-numbers");

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

  async function handleApply() {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await addPageNumbers(file, {
        position,
        fontSize,
        format,
        startPage,
      });
      setResult(blob);
    } catch (e) {
      console.error("Add page numbers failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  const formatLabels: Record<NumberFormat, string> = {
    number: "1, 2, 3...",
    pageN: "Page 1, Page 2...",
    nOfTotal: "1 / N, 2 / N...",
  };

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
                {/* Position */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("position")}</label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map((pos) => (
                      <Button
                        key={pos}
                        size="sm"
                        variant={position === pos ? "primary" : "outline"}
                        onClick={() => { setPosition(pos); setResult(null); }}
                      >
                        {t(`positions.${pos}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("format")}</label>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map((fmt) => (
                      <Button
                        key={fmt}
                        size="sm"
                        variant={format === fmt ? "primary" : "outline"}
                        onClick={() => { setFormat(fmt); setResult(null); }}
                      >
                        {formatLabels[fmt]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {t("fontSize")}: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    value={fontSize}
                    onChange={(e) => { setFontSize(Number(e.target.value)); setResult(null); }}
                    className="w-full max-w-xs"
                  />
                </div>

                {/* Start Page */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("startPage")}</label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={startPage}
                    onChange={(e) => { setStartPage(Number(e.target.value)); setResult(null); }}
                    className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={handleApply} disabled={processing}>
                  {processing ? t("applying") : t("apply")}
                </Button>
                {result && (
                  <DownloadButton
                    data={result}
                    filename={file.name.replace(/\.pdf$/i, "_numbered.pdf")}
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
