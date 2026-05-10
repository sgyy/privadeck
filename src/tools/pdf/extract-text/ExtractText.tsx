"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ScanText, X } from "lucide-react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PdfFilePreview } from "@/components/shared/PdfFilePreview";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  getPdfPreview,
  PdfEncryptedError,
  PdfWrongPasswordError,
} from "@/lib/pdf/getPdfPreview";
import { parsePageRange } from "@/lib/pdf/parsePageRange";
import { createToolTracker } from "@/lib/analytics";
import {
  extractText,
  extractTextOcr,
  formatResult,
  OCR_LANGUAGES,
  type ExtractResult,
  type OutputFormat,
} from "./logic";
import { ExtractTextPreview } from "./ExtractTextPreview";

const tracker = createToolTracker("extract-text", "pdf");

function detectOcrLang(): string {
  if (typeof navigator === "undefined") return "eng";
  const lang = navigator.language?.toLowerCase() ?? "en";
  if (
    lang.startsWith("zh-tw") ||
    lang.startsWith("zh-hk") ||
    lang.startsWith("zh-hant")
  )
    return "chi_tra";
  if (lang.startsWith("zh")) return "chi_sim";
  if (lang.startsWith("ja")) return "jpn";
  if (lang.startsWith("ko")) return "kor";
  if (lang.startsWith("es")) return "spa";
  if (lang.startsWith("fr")) return "fra";
  if (lang.startsWith("de")) return "deu";
  if (lang.startsWith("pt")) return "por";
  if (lang.startsWith("ar")) return "ara";
  if (lang.startsWith("ru")) return "rus";
  if (lang.startsWith("hi")) return "hin";
  return "eng";
}

export default function ExtractText() {
  const t = useTranslations("tools.pdf.extract-text");
  const tc = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [rangeInput, setRangeInput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("plain");
  const [ocrLang, setOcrLang] = useState<string>("eng");

  const [result, setResult] = useState<ExtractResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState<"text" | "ocr" | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    pageProgress?: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [ocrDismissed, setOcrDismissed] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // SSR returns "eng" (no navigator); detect the actual locale only after the
  // client mounts to avoid hydration mismatch on SSR'd HTML.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional CSR-only override after hydration
    setOcrLang(detectOcrLang());
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const output = useMemo(
    () => (result ? formatResult(result.pages, format) : ""),
    [result, format],
  );

  async function loadPreview(f: File, pwd?: string) {
    try {
      const {
        pdfDoc,
        pageCount: pc,
        thumbnail: thumb,
      } = await getPdfPreview(f, { password: pwd });
      // Preview only needs pageCount + thumbnail — release the WASM-backed doc.
      pdfDoc.destroy();
      setPageCount(pc);
      setThumbnail(thumb);
      setNeedsPassword(false);
      setPasswordError(false);
    } catch (e) {
      if (e instanceof PdfEncryptedError) {
        setNeedsPassword(true);
        setPasswordError(false);
      } else if (e instanceof PdfWrongPasswordError) {
        setNeedsPassword(true);
        setPasswordError(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    }
  }

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    resetState();
    setFile(f);
    await loadPreview(f);
  }

  function resetState() {
    abortRef.current?.abort();
    setResult(null);
    setError("");
    setPageCount(null);
    setThumbnail(null);
    setNeedsPassword(false);
    setPassword("");
    setPasswordError(false);
    setRangeInput("");
    setOcrDismissed(false);
    setProgress(null);
    setPhase(null);
  }

  function handleRemoveFile() {
    setFile(null);
    resetState();
  }

  async function handleUnlock() {
    if (!file || !password) return;
    await loadPreview(file, password);
  }

  function getPagesArg(total: number): number[] | undefined {
    if (!rangeInput.trim()) return undefined;
    const pages = parsePageRange(rangeInput, total);
    return pages.length > 0 ? pages : undefined;
  }

  async function handleExtract() {
    if (!file || !pageCount) return;
    setProcessing(true);
    setPhase("text");
    setResult(null);
    setError("");
    setOcrDismissed(false);
    setProgress(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t0 = performance.now();

    try {
      const res = await extractText(file, {
        pages: getPagesArg(pageCount),
        password: password || undefined,
        signal: ctrl.signal,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      setResult(res);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // user-cancelled
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        setError(msg);
      }
    } finally {
      setProcessing(false);
      setPhase(null);
      setProgress(null);
      abortRef.current = null;
    }
  }

  async function handleOcr() {
    if (!file || !pageCount) return;
    setProcessing(true);
    setPhase("ocr");
    setResult(null);
    setError("");
    setProgress(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t0 = performance.now();

    try {
      const res = await extractTextOcr(file, {
        language: ocrLang,
        pages: getPagesArg(pageCount),
        password: password || undefined,
        signal: ctrl.signal,
        onProgress: (current, total, pageProgress) =>
          setProgress({ current, total, pageProgress }),
      });
      setResult(res);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // user-cancelled
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        setError(msg);
      }
    } finally {
      setProcessing(false);
      setPhase(null);
      setProgress(null);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  const downloadFilename = useMemo(() => {
    const base = file?.name.replace(/\.pdf$/i, "") ?? "extracted";
    const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
    return `${base}.${ext}`;
  }, [file, format]);

  const downloadBlob = useMemo(() => {
    const mime =
      format === "json"
        ? "application/json"
        : format === "markdown"
          ? "text/markdown"
          : "text/plain";
    return new Blob([output], { type: `${mime};charset=utf-8` });
  }, [output, format]);

  const showOcrBanner =
    !!result &&
    result.isLikelyScanned &&
    phase === null &&
    !ocrDismissed &&
    result.pages.length > 0;

  return (
    <div className="space-y-4">
      {!file && <FileDropzone accept="application/pdf" onFiles={handleFile} />}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {file && (
        <PdfFilePreview
          file={file}
          pageCount={pageCount}
          thumbnail={thumbnail}
          disabled={processing}
          onReplace={(f) => void handleFile([f])}
          onRemove={handleRemoveFile}
        />
      )}

      {file && needsPassword && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t("passwordPrompt")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleUnlock()}
              placeholder={t("password")}
              className="h-10 flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button onClick={handleUnlock} disabled={!password}>
              {t("unlock")}
            </Button>
          </div>
          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("wrongPassword")}
            </p>
          )}
        </div>
      )}

      {file && pageCount && !needsPassword && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t("pageRange")}
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={t("pageRangeHint", { total: pageCount })}
                disabled={processing}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t("outputFormat")}
              </label>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                disabled={processing}
                className="w-full"
              >
                <option value="plain">{t("format.plain")}</option>
                <option value="markdown">{t("format.markdown")}</option>
                <option value="json">{t("format.json")}</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-3">
            {!processing ? (
              <Button onClick={handleExtract}>{t("extract")}</Button>
            ) : (
              <Button onClick={handleCancel} variant="outline">
                {tc("cancel")}
              </Button>
            )}
            {processing && progress && (
              <span className="text-xs text-muted-foreground">
                {phase === "ocr"
                  ? t("ocrProgress", {
                      current: progress.current,
                      total: progress.total,
                      pct: progress.pageProgress ?? 0,
                    })
                  : t("progress", {
                      current: progress.current,
                      total: progress.total,
                    })}
              </span>
            )}
          </div>
        </div>
      )}

      {showOcrBanner && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900 dark:bg-cyan-950/50">
          <div className="flex items-start gap-3">
            <ScanText className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-cyan-900 dark:text-cyan-200">
                {t("ocrPrompt")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value)}
                  className="min-w-[140px]"
                >
                  {OCR_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </Select>
                <Button onClick={handleOcr}>{t("runOcr")}</Button>
                <Button
                  variant="ghost"
                  onClick={() => setOcrDismissed(true)}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  {tc("dismiss")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && result.totalChars > 0 && (
        <ExtractTextPreview
          result={result}
          format={format}
          output={output}
          downloadFilename={downloadFilename}
          downloadBlob={downloadBlob}
        />
      )}

      {result && result.totalChars === 0 && !showOcrBanner && (
        <p className="text-sm text-muted-foreground">{t("noTextFound")}</p>
      )}
    </div>
  );
}
