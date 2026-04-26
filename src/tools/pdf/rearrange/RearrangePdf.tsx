"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, ArrowDown } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { PdfPagePreview } from "@/components/shared/PdfPagePreview";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { rearrangePdf, formatFileSize } from "./logic";

export default function RearrangePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const t = useTranslations("tools.pdf.rearrange");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setPageOrder([]);
    setPdfDoc(null);
    setPageCount(0);
    setThumbnail(null);
    // Destroy previous PDF document to free memory
    pdfDocRef.current?.destroy();
    try {
      const { pdfDoc: doc, pageCount: pc, thumbnail: thumb } = await getPdfPreview(f);
      pdfDocRef.current = doc;
      setPdfDoc(doc);
      setPageCount(pc);
      setThumbnail(thumb);
      setPageOrder(Array.from({ length: pc }, (_, i) => i));
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleRemoveFile() {
    pdfDocRef.current?.destroy();
    pdfDocRef.current = null;
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setThumbnail(null);
    setPageOrder([]);
    setResult(null);
    setError("");
  }

  function moveUp(index: number) {
    setPageOrder((prev) => {
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setResult(null);
  }

  function moveDown(index: number) {
    setPageOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setResult(null);
  }

  async function handleApply() {
    if (!file || pageOrder.length === 0) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await rearrangePdf(file, pageOrder);
      setResult(blob);
    } catch (e) {
      console.error("Rearrange failed:", e);
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
        <PdfFilePreview
          file={file}
          pageCount={pageCount > 0 ? pageCount : null}
          thumbnail={thumbnail}
          disabled={processing}
          onReplace={(f) => void handleFile([f])}
          onRemove={handleRemoveFile}
        />
      )}

      {pdfDoc && pageOrder.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {t("dragHint")} ({pageOrder.length} {t("pages")})
          </p>
          <div className="space-y-3">
            {pageOrder.map((pageIndex, position) => (
              <div
                key={`${pageIndex}-${position}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
              >
                <PdfPagePreview
                  pdf={pdfDoc}
                  pageNumber={pageIndex + 1}
                  width={80}
                />
                <div className="flex-1 text-sm font-medium">
                  {t("page")} {pageIndex + 1}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveUp(position)}
                    disabled={position === 0 || processing}
                    aria-label={t("moveUp")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveDown(position)}
                    disabled={position === pageOrder.length - 1 || processing}
                    aria-label={t("moveDown")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleApply} disabled={processing}>
              {processing ? t("processing") : t("apply")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={file!.name.replace(/\.pdf$/i, "_rearranged.pdf")}
              />
            )}
          </div>

          {result && (
            <p className="text-sm text-muted-foreground">
              {formatFileSize(result.size)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
