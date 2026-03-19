"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import {
  splitByPages,
  splitByRange,
  getPdfPageCount,
  formatFileSize,
  type SplitResult,
} from "./logic";

type SplitMode = "each" | "range";

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<SplitMode>("each");
  const [rangeInput, setRangeInput] = useState("");
  const [results, setResults] = useState<SplitResult[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.split");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    const count = await getPdfPageCount(f);
    setPageCount(count);
  }

  function parseRanges(): [number, number][] {
    return rangeInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const parts = s.split("-").map(Number);
        if (parts.length === 1) return [parts[0], parts[0]] as [number, number];
        return [parts[0], parts[1]] as [number, number];
      })
      .filter(([a, b]) => a >= 1 && b >= a && b <= pageCount);
  }

  async function handleSplit() {
    if (!file) return;
    setSplitting(true);
    setResults([]);
    setError("");
    try {
      if (mode === "each") {
        setResults(await splitByPages(file));
      } else {
        const ranges = parseRanges();
        if (ranges.length === 0) {
          setError(t("rangeHint"));
          setSplitting(false);
          return;
        }
        setResults(await splitByRange(file, ranges));
      }
    } catch (e) {
      console.error("Split failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSplitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="application/pdf"
        onFiles={handleFile}
      />

      {file && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          {file.name} — {pageCount} {t("pages")}
        </div>
      )}

      {file && (
        <div className="space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={mode === "each"}
                onChange={() => setMode("each")}
              />
              {t("splitEach")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={mode === "range"}
                onChange={() => setMode("range")}
              />
              {t("splitRange")}
            </label>
          </div>

          {mode === "range" && (
            <div>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={t("rangePlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("rangeHint")}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <Button onClick={handleSplit} disabled={splitting}>
            {splitting ? t("splitting") : t("split")}
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("results")}</h3>
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {r.pageCount} {t("pages")} · {formatFileSize(r.blob.size)}
                </p>
              </div>
              <DownloadButton data={r.blob} filename={r.filename} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
