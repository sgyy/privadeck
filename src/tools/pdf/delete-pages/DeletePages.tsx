"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { PdfPagePreview } from "@/components/shared/PdfPagePreview";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getPdfjs } from "@/lib/pdfjs";
import { deletePages, formatFileSize } from "./logic";

export default function DeletePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.delete-pages");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setSelected(new Set());
    setResult(null);
    setError("");
    try {
      const pdfjsLib = await getPdfjs();
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setPageCount(pdf.numPages);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function togglePage(page: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
    setResult(null);
  }

  async function handleDelete() {
    if (!file || selected.size === 0 || selected.size >= pageCount) return;
    setProcessing(true);
    setResult(null);
    setError("");
    try {
      const blob = await deletePages(file, selected);
      setResult(blob);
    } catch (e) {
      console.error("Delete pages failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" onFiles={handleFile} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {pdfDoc && pageCount > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {t("selectPages")} ({selected.size}/{pageCount})
          </p>
          <div className="flex flex-wrap gap-3">
            {pages.map((page) => (
              <PdfPagePreview
                key={page}
                pdf={pdfDoc}
                pageNumber={page}
                width={120}
                selected={selected.has(page)}
                onClick={() => togglePage(page)}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleDelete}
              disabled={
                selected.size === 0 ||
                selected.size >= pageCount ||
                processing
              }
            >
              {processing ? t("deleting") : t("delete")}
            </Button>
            {result && (
              <DownloadButton
                data={result}
                filename={file!.name.replace(/\.pdf$/i, "_edited.pdf")}
              />
            )}
          </div>

          {result && (
            <p className="text-sm text-muted-foreground">
              {t("remaining")}: {pageCount - selected.size} {t("pages")} ·{" "}
              {formatFileSize(result.size)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
