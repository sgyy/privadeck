"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, AlertTriangle, Lock, X, Eye } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { CompareSlider } from "@/components/shared/CompareSlider";
import { PdfFullscreenPreview } from "@/components/shared/PdfFullscreenPreview";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getPdfPreview, PdfEncryptedError } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import {
  compressPdf,
  compressToTargetSize,
  formatFileSize,
  type PdfQuality,
  type CompressMode,
  type CompressReport,
  type SizeMode,
} from "./logic";

const tracker = createToolTracker("compress", "pdf");
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;
const REPORT_TOP_N = 10;

const DPI_OPTIONS = [72, 96, 150, 200];

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [mode, setMode] = useState<CompressMode>("auto");
  const [sizeMode, setSizeMode] = useState<SizeMode>("preset");
  const [targetSizeMb, setTargetSizeMb] = useState(1);
  const [quality, setQuality] = useState<PdfQuality>("medium");
  const [customDpi, setCustomDpi] = useState(96);
  const [customJpegQuality, setCustomJpegQuality] = useState(60);
  const [removeMetadata, setRemoveMetadata] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [usedOriginal, setUsedOriginal] = useState(false);
  const [modeUsed, setModeUsed] = useState<CompressMode | null>(null);
  const [targetMet, setTargetMet] = useState<boolean | null>(null);
  const [report, setReport] = useState<CompressReport | null>(null);
  const [detectedMode, setDetectedMode] = useState<CompressMode | null>(null);
  const [comparePreview, setComparePreview] = useState<{
    before: string;
    after: string;
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    kind: "page" | "image" | "iteration";
    current: number;
    total: number;
    iterationQuality?: PdfQuality;
  }>({ kind: "page", current: 0, total: 0 });
  const [error, setError] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const t = useTranslations("tools.pdf.compress");
  const tCat = useTranslations("tools.pdf");

  function clearResult() {
    setResult(null);
    setUsedOriginal(false);
    setModeUsed(null);
    setDetectedMode(null);
    setTargetMet(null);
    setReport(null);
    setComparePreview(null);
    setReportOpen(false);
    setPreviewOpen(false);
  }

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    clearResult();
    setError("");
    setEncrypted(false);
    setProgress({ kind: "page", current: 0, total: 0 });
    setPageCount(null);
    setThumbnail(null);
    try {
      const { pageCount: pc, thumbnail: thumb } = await getPdfPreview(f);
      setPageCount(pc);
      setThumbnail(thumb);
    } catch (e) {
      if (e instanceof PdfEncryptedError) {
        setEncrypted(true);
      } else {
        setError(String(e instanceof Error ? e.message : e));
      }
    }
  }

  function handleRemoveFile() {
    setFile(null);
    setPageCount(null);
    setThumbnail(null);
    clearResult();
    setError("");
    setEncrypted(false);
    setProgress({ kind: "page", current: 0, total: 0 });
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  useEffect(() => {
    if (!result || !file) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [beforePreview, afterPreview] = await Promise.all([
          getPdfPreview(file, { thumbnailWidth: 600 }),
          getPdfPreview(result, { thumbnailWidth: 600 }),
        ]);
        if (!cancelled) {
          setComparePreview({
            before: beforePreview.thumbnail,
            after: afterPreview.thumbnail,
          });
        }
        // Release pdfjs Worker memory; thumbnails are already extracted as data URLs.
        beforePreview.pdfDoc.destroy();
        afterPreview.pdfDoc.destroy();
      } catch {
        if (!cancelled) setComparePreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result, file]);

  async function handleCompress() {
    if (!file) return;
    setProcessing(true);
    clearResult();
    setError("");
    setProgress({ kind: "page", current: 0, total: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    const t0 = performance.now();
    try {
      const result =
        sizeMode === "target"
          ? await compressToTargetSize(
              file,
              {
                mode,
                targetBytes: Math.max(0.05, targetSizeMb) * 1024 * 1024,
                cleanup: { removeMetadata },
                signal: controller.signal,
              },
              (event) => {
                if (event.kind === "iteration") {
                  setProgress({
                    kind: "iteration",
                    current: event.iteration,
                    total: event.totalIterations,
                    iterationQuality: event.quality,
                  });
                } else {
                  setProgress(event);
                }
              },
            )
          : await compressPdf(
              file,
              {
                mode,
                quality,
                customDpi,
                customJpegQuality,
                cleanup: { removeMetadata },
                signal: controller.signal,
              },
              (event) => {
                setProgress(event);
              },
            );
      setResult(result.blob);
      setUsedOriginal(result.usedOriginal);
      setModeUsed(result.modeUsed);
      setDetectedMode(result.detectedMode ?? null);
      setTargetMet(result.targetMet ?? null);
      setReport(result.report ?? null);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      if (!isAbort) {
        console.error("Compress failed:", e);
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        setError(msg);
      }
    } finally {
      abortRef.current = null;
      setProcessing(false);
      setProgress({ kind: "page", current: 0, total: 0 });
    }
  }

  const isLargeFile = file !== null && file.size > LARGE_FILE_THRESHOLD;

  return (
    <div className="space-y-4">
      {!file && !encrypted && <FileDropzone accept="application/pdf" onFiles={handleFile} />}

      {encrypted && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <Lock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{t("encryptedTitle")}</p>
              <p className="mt-1 text-xs opacity-90">{t("encryptedDescription")}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleRemoveFile}>
            {t("chooseAnother")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {file && !encrypted && (
        <div className="space-y-4">
          <PdfFilePreview
            file={file}
            pageCount={pageCount}
            thumbnail={thumbnail}
            disabled={processing}
            onReplace={(f) => void handleFile([f])}
            onRemove={handleRemoveFile}
          />

          {isLargeFile && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t("largeFileWarning")}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("mode")}</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["auto", "image-optimize", "rasterize"] as CompressMode[]).map((m) => {
                const labelKey =
                  m === "auto"
                    ? "modeAuto"
                    : m === "image-optimize"
                      ? "modeImageOptimize"
                      : "modeRasterize";
                const descKey =
                  m === "auto"
                    ? "modeAutoDesc"
                    : m === "image-optimize"
                      ? "modeImageOptimizeDesc"
                      : "modeRasterizeDesc";
                return (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      mode === m ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={mode === m}
                      onChange={() => {
                        setMode(m);
                        clearResult();
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">{t(labelKey)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{t(descKey)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("sizeMode")}</label>
            <div className="flex flex-wrap gap-4">
              {(["preset", "target"] as SizeMode[]).map((sm) => (
                <label key={sm} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={sizeMode === sm}
                    onChange={() => {
                      setSizeMode(sm);
                      clearResult();
                    }}
                  />
                  {t(sm === "preset" ? "sizeModePreset" : "sizeModeTarget")}
                </label>
              ))}
            </div>
          </div>

          {sizeMode === "preset" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("quality")}</label>
              <div className="flex flex-wrap gap-4">
                {(["high", "medium", "low", "custom"] as PdfQuality[]).map((q) => (
                  <label key={q} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={quality === q}
                      onChange={() => {
                        setQuality(q);
                        clearResult();
                        if (q === "custom") setAdvancedOpen(true);
                      }}
                    />
                    {t(q)}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="target-size-input">
                {t("targetSize")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="target-size-input"
                  type="number"
                  min={0.05}
                  step={0.1}
                  value={targetSizeMb}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) {
                      setTargetSizeMb(v);
                      clearResult();
                    }
                  }}
                  className="h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-sm text-muted-foreground">MB</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("targetSizeHint")}</p>
            </div>
          )}

          <div className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50"
            >
              {advancedOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {t("advanced")}
            </button>

            {advancedOpen && (
              <div className="space-y-4 border-t border-border p-4">
                {sizeMode === "preset" && quality === "custom" && (
                  <>
                    <div className="flex flex-wrap items-end gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          {t("customDpi")}
                        </label>
                        <Select
                          value={String(customDpi)}
                          onChange={(e) => {
                            setCustomDpi(Number(e.target.value));
                            clearResult();
                          }}
                        >
                          {DPI_OPTIONS.map((dpi) => (
                            <option key={dpi} value={dpi}>
                              {dpi} DPI
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          {t("customJpegQuality")}: {customJpegQuality}%
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={95}
                          value={customJpegQuality}
                          onChange={(e) => {
                            setCustomJpegQuality(Number(e.target.value));
                            clearResult();
                          }}
                          className="w-48 cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("customHint")}</p>
                  </>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("cleanupOptions")}</p>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={removeMetadata}
                      onChange={(e) => {
                        setRemoveMetadata(e.target.checked);
                        clearResult();
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">{t("removeMetadata")}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t("removeMetadataDesc")}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            )}
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
                {progress.kind === "iteration"
                  ? `${t("iteration")} ${progress.current}/${progress.total}${
                      progress.iterationQuality ? ` · ${t(progress.iterationQuality)}` : ""
                    }`
                  : progress.kind === "image"
                    ? `${t("processingImages")} ${progress.current}/${progress.total}`
                    : `${t("compressing")} ${progress.current}/${progress.total} ${tCat("pages")}`}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={handleCompress} disabled={processing}>
              {processing ? t("compressing") : t("compress")}
            </Button>
            {processing && (
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
                {t("cancel")}
              </Button>
            )}
            {result && (
              <>
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4" />
                  {tCat("previewFullscreen")}
                </Button>
                <DownloadButton
                  data={result}
                  filename={file.name.replace(/\.pdf$/i, "_compressed.pdf")}
                />
              </>
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
                {usedOriginal
                  ? t("noReductionUsedOriginal")
                  : file.size > result.size
                    ? `${(((file.size - result.size) / file.size) * 100).toFixed(1)}%`
                    : t("noReduction")}
              </p>
              {detectedMode && mode === "auto" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("autoChose", {
                    chosen: t(detectedMode === "image-optimize" ? "modeImageOptimize" : "modeRasterize"),
                  })}
                </p>
              )}
              {modeUsed === "rasterize" &&
                (mode === "image-optimize" ||
                  (mode === "auto" && detectedMode === "image-optimize")) && (
                  <p className="mt-1 text-xs text-muted-foreground">{t("fellBackToRasterize")}</p>
                )}
              {sizeMode === "target" && targetMet === false && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {t("targetNotMet", { target: targetSizeMb })}
                </p>
              )}
            </div>
          )}

          {result && comparePreview && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("comparePreview")}</p>
              <CompareSlider
                beforeSrc={comparePreview.before}
                afterSrc={comparePreview.after}
              />
              <p className="text-xs text-muted-foreground">{t("comparePreviewHint")}</p>
            </div>
          )}

          {result && report && report.items.length > 0 && (
            <div className="rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setReportOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50"
              >
                {reportOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {t("compressionReport")}{" "}
                <span className="text-xs text-muted-foreground">
                  ({report.items.length}{" "}
                  {modeUsed === "rasterize" ? tCat("pages") : t("processingImages").toLowerCase()})
                </span>
              </button>
              {reportOpen && (() => {
                const maxBefore = Math.max(...report.items.map((it) => it.beforeBytes));
                const topItems = [...report.items]
                  .sort((a, b) => b.beforeBytes - a.beforeBytes)
                  .slice(0, REPORT_TOP_N);
                return (
                <div className="space-y-1.5 border-t border-border p-3">
                  {topItems.map((item) => {
                      const beforePct = (item.beforeBytes / maxBefore) * 100;
                      const afterPct = (item.afterBytes / maxBefore) * 100;
                      const saved =
                        item.beforeBytes > 0
                          ? ((item.beforeBytes - item.afterBytes) / item.beforeBytes) * 100
                          : 0;
                      return (
                        <div key={item.label} className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono">{item.label}</span>
                            <span className="text-muted-foreground">
                              {formatFileSize(item.beforeBytes)} → {formatFileSize(item.afterBytes)} (
                              {saved > 0 ? `-${saved.toFixed(0)}%` : "0%"})
                            </span>
                          </div>
                          <div className="relative mt-0.5 h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
                              style={{ width: `${beforePct}%` }}
                            />
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-primary"
                              style={{ width: `${afterPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {report.items.length > REPORT_TOP_N && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {t("reportShowingTop", {
                        count: REPORT_TOP_N,
                        total: report.items.length,
                      })}
                    </p>
                  )}
                </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <PdfFullscreenPreview
        blob={result}
        title={file ? file.name.replace(/\.pdf$/i, "_compressed.pdf") : undefined}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
