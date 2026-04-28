"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { Button } from "@/components/ui/Button";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import { ModeTabs } from "./components/ModeTabs";
import { ModeOptionsPanel } from "./components/ModeOptionsPanel";
import { ThumbnailGrid } from "./components/ThumbnailGrid";
import { ResultsPanel } from "./components/ResultsPanel";
import type { ModeContext } from "./colors";
import {
  splitByEach,
  splitByEvery,
  splitByOddEven,
  splitByHalf,
  splitByRange,
  splitBySize,
  splitByOutline,
  readOutlineSections,
  parseRanges,
  type SplitMode,
  type SplitResult,
  type SplitProgress,
  type OutlineSection,
} from "./logic";

const LARGE_PDF_THRESHOLD = 500;

const tracker = createToolTracker("split", "pdf");

export default function SplitPdf() {
  const t = useTranslations("tools.pdf.split");

  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const [mode, setMode] = useState<SplitMode>("each");
  const [everyN, setEveryN] = useState(2);
  const [rangeInput, setRangeInput] = useState("");
  const [mergeAllRanges, setMergeAllRanges] = useState(false);
  const [maxSize, setMaxSize] = useState(5);
  const [maxSizeUnit, setMaxSizeUnit] = useState<"KB" | "MB">("MB");
  const [editingRangeStart, setEditingRangeStart] = useState<number | null>(null);

  const [outlineSections, setOutlineSections] = useState<OutlineSection[] | null>(null);

  const [results, setResults] = useState<SplitResult[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [progress, setProgress] = useState<SplitProgress | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    setError("");
    setPageCount(0);
    setThumbnail(null);
    setPdfDoc(null);
    setOutlineSections(null);
    setRangeInput("");
    setEditingRangeStart(null);
    try {
      const { pdfDoc: doc, pageCount: pc, thumbnail: thumb } = await getPdfPreview(f);
      setPdfDoc(doc);
      setPageCount(pc);
      setThumbnail(thumb);
      try {
        const sections = await readOutlineSections(f);
        setOutlineSections(sections);
      } catch {
        setOutlineSections([]);
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleRemoveFile() {
    abortRef.current?.abort();
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setThumbnail(null);
    setOutlineSections(null);
    setResults([]);
    setError("");
    setRangeInput("");
    setEditingRangeStart(null);
    setProgress(null);
  }

  function handlePageClickForRange(page: number) {
    if (editingRangeStart === null) {
      setEditingRangeStart(page);
      return;
    }
    const start = Math.min(editingRangeStart, page);
    const end = Math.max(editingRangeStart, page);
    const newSeg = start === end ? `${start}` : `${start}-${end}`;
    const next = rangeInput.trim() ? `${rangeInput}, ${newSeg}` : newSeg;
    setRangeInput(next);
    setEditingRangeStart(null);
  }

  const ranges = parseRanges(rangeInput).filter(
    ([s, e]) => s >= 1 && e <= pageCount && e >= s,
  );

  const modeContext: ModeContext = (() => {
    switch (mode) {
      case "each":
        return { mode: "each", total: pageCount };
      case "every":
        return { mode: "every", total: pageCount, n: everyN };
      case "oddEven":
        return { mode: "oddEven" };
      case "half":
        return { mode: "half", total: pageCount };
      case "range":
        return { mode: "range", ranges };
      case "size":
        return { mode: "size", total: pageCount };
      case "outline":
        return {
          mode: "outline",
          sectionStarts: (outlineSections ?? []).map((s) => s.pageIndex + 1),
        };
    }
  })();

  const disabledModes: Partial<Record<SplitMode, string>> = {};
  if (pageCount > 0 && pageCount < 2) {
    disabledModes.half = t("errors.tooFewPagesForHalf");
    disabledModes.oddEven = t("errors.tooFewPagesForHalf");
  }
  if (outlineSections !== null && outlineSections.length === 0) {
    disabledModes.outline = t("outline.noOutline");
  }

  async function handleCancel() {
    abortRef.current?.abort();
  }

  async function handleSplit() {
    if (!file || pageCount === 0) return;

    if (mode === "each" && pageCount > LARGE_PDF_THRESHOLD) {
      const ok = window.confirm(
        t("errors.largeWarning", { count: pageCount }),
      );
      if (!ok) return;
    }

    setSplitting(true);
    setResults([]);
    setError("");
    setProgress(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t0 = performance.now();

    const onProgress = (p: SplitProgress) => setProgress(p);

    try {
      let res: SplitResult[];
      switch (mode) {
        case "each":
          res = await splitByEach(file, ctrl.signal, onProgress);
          break;
        case "every":
          if (everyN < 1 || everyN > pageCount) {
            throw new Error(
              t("errors.invalidEvery", { max: Math.max(1, pageCount - 1) }),
            );
          }
          res = await splitByEvery(file, everyN, ctrl.signal, onProgress);
          break;
        case "oddEven":
          res = await splitByOddEven(file, ctrl.signal);
          break;
        case "half":
          res = await splitByHalf(file, ctrl.signal);
          break;
        case "range": {
          if (ranges.length === 0) {
            throw new Error(t("rangeHint"));
          }
          res = await splitByRange(
            file,
            ranges,
            mergeAllRanges,
            ctrl.signal,
            onProgress,
          );
          break;
        }
        case "size": {
          const bytes = maxSize * (maxSizeUnit === "MB" ? 1024 * 1024 : 1024);
          if (!Number.isFinite(bytes) || bytes <= 0) {
            throw new Error(t("errors.invalidSize"));
          }
          res = await splitBySize(file, bytes, ctrl.signal, onProgress);
          break;
        }
        case "outline":
          res = await splitByOutline(file, ctrl.signal, onProgress);
          break;
        default:
          res = [];
      }
      setResults(res);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // user-initiated cancel; silent
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        // map known logic-layer errors to localized messages
        let display = msg;
        if (msg === "no_outline") display = t("outline.noOutline");
        else if (msg === "no_ranges" || msg === "no_valid_ranges")
          display = t("rangeHint");
        else if (msg === "invalid_max_size") display = t("errors.invalidSize");
        else if (msg === "invalid_every_n")
          display = t("errors.invalidEvery", { max: Math.max(1, pageCount - 1) });
        else if (msg === "too_few_pages_for_half")
          display = t("errors.tooFewPagesForHalf");
        else if (/encrypt/i.test(msg)) display = t("errors.encrypted");
        setError(display);
        console.error("Split failed:", e);
      }
    } finally {
      setSplitting(false);
      setProgress(null);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const zipName = file
    ? `${file.name.replace(/\.pdf$/i, "")}_split.zip`
    : "split.zip";

  return (
    <div className="space-y-4">
      {!file && (
        <FileDropzone accept="application/pdf" onFiles={handleFile} />
      )}

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
          disabled={splitting}
          onReplace={(f) => void handleFile([f])}
          onRemove={handleRemoveFile}
        />
      )}

      {file && pageCount > 0 && (
        <>
          <ModeTabs mode={mode} onChange={setMode} disabledModes={disabledModes} />
          <ModeOptionsPanel
            mode={mode}
            pageCount={pageCount}
            everyN={everyN}
            setEveryN={setEveryN}
            rangeInput={rangeInput}
            setRangeInput={setRangeInput}
            mergeAllRanges={mergeAllRanges}
            setMergeAllRanges={setMergeAllRanges}
            maxSize={maxSize}
            maxSizeUnit={maxSizeUnit}
            setMaxSize={setMaxSize}
            setMaxSizeUnit={setMaxSizeUnit}
            outlineSections={outlineSections}
          />

          {pdfDoc && (
            <ThumbnailGrid
              pdf={pdfDoc}
              pageCount={pageCount}
              mode={mode}
              modeContext={modeContext}
              editingRangeStart={editingRangeStart}
              onPageClickForRange={handlePageClickForRange}
            />
          )}

          <div className="flex items-center gap-3">
            {!splitting ? (
              <Button onClick={handleSplit} disabled={splitting}>
                {t("split")}
              </Button>
            ) : (
              <Button onClick={handleCancel} variant="outline">
                {t("actions.cancel")}
              </Button>
            )}
            {splitting && progress && (
              <span className="text-xs text-muted-foreground">
                {progress.phase === "probing"
                  ? t("size.probing")
                  : t("progress.splitting", {
                      current: progress.current,
                      total: progress.total,
                    })}
              </span>
            )}
          </div>
        </>
      )}

      <ResultsPanel results={results} zipName={zipName} />
    </div>
  );
}
