"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import { extractText } from "./logic";

const tracker = createToolTracker("extract-text", "pdf");

export default function ExtractText() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.extract-text");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setText("");
    setError("");
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
    setText("");
    setError("");
  }

  async function handleExtract() {
    if (!file) return;
    setProcessing(true);
    setText("");
    setError("");
    const t0 = performance.now();
    try {
      const result = await extractText(file);
      setText(result || t("noTextFound"));
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Extraction failed:", e);
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
        <>
          <PdfFilePreview
            file={file}
            pageCount={pageCount}
            thumbnail={thumbnail}
            disabled={processing}
            onReplace={(f) => void handleFile([f])}
            onRemove={handleRemoveFile}
          />

          <Button onClick={handleExtract} disabled={processing}>
            {processing ? t("extracting") : t("extract")}
          </Button>
        </>
      )}

      {text && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("extractedText")}</span>
            <CopyButton text={text} />
          </div>
          <textarea
            readOnly
            value={text}
            className="h-80 w-full rounded-lg border bg-muted/50 p-3 font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
}
