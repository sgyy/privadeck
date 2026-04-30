"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { batchToCsv, processBatch, type BatchRow, type TimestampUnit } from "../logic";

export type BatchMode = "auto" | "timestamp" | "date";

export interface BatchState {
  text: string;
  mode: BatchMode;
  unit: TimestampUnit | "auto";
  rows: BatchRow[];
}

export const INITIAL_BATCH_STATE: BatchState = { text: "", mode: "auto", unit: "auto", rows: [] };

export function BatchTab({
  tz,
  state,
  onStateChange,
}: {
  tz: string;
  state: BatchState;
  onStateChange: (next: BatchState) => void;
}) {
  const t = useTranslations("tools.developer.timestamp");
  const { text, mode, unit, rows } = state;

  const summary = useMemo(() => {
    if (rows.length === 0) return "";
    const ok = rows.filter((r) => r.ok).length;
    const err = rows.length - ok;
    return t("batchSummary", { total: rows.length, ok, error: err });
  }, [rows, t]);

  function handleConvert() {
    onStateChange({ ...state, rows: processBatch(text, mode, unit, tz) });
  }

  function handleClear() {
    onStateChange({ ...state, text: "", rows: [] });
  }

  function handleDownload() {
    if (rows.length === 0) return;
    const csv = batchToCsv(rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timestamps.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("batchModeLabel")}</label>
          <Select value={mode} onChange={(e) => onStateChange({ ...state, mode: e.target.value as BatchMode })} className="w-full">
            <option value="auto">{t("batchModeAuto")}</option>
            <option value="timestamp">{t("batchModeTimestamp")}</option>
            <option value="date">{t("batchModeDate")}</option>
          </Select>
        </div>
        {mode !== "date" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("unit")}</label>
            <Select value={unit} onChange={(e) => onStateChange({ ...state, unit: e.target.value as TimestampUnit | "auto" })}>
              <option value="auto">{t("unitAuto")}</option>
              <option value="s">{t("unitSeconds")}</option>
              <option value="ms">{t("unitMilliseconds")}</option>
              <option value="us">{t("unitMicroseconds")}</option>
              <option value="ns">{t("unitNanoseconds")}</option>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("batchInputLabel")}</label>
        <textarea
          value={text}
          onChange={(e) => onStateChange({ ...state, text: e.target.value })}
          placeholder={t("batchInputPlaceholder")}
          rows={6}
          className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleConvert} disabled={!text.trim()}>
          {t("batchConvert")}
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          {t("batchDownloadCsv")}
        </Button>
        <Button variant="ghost" onClick={handleClear} disabled={!text && rows.length === 0}>
          <Trash2 className="h-4 w-4" />
          {t("batchClear")}
        </Button>
        {summary && <span className="ml-auto text-xs text-muted-foreground">{summary}</span>}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("batchEmpty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{t("batchHeaderInput")}</th>
                <th className="px-3 py-2">{t("batchHeaderResult")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={i} className={r.ok ? "" : "bg-red-50/40 dark:bg-red-950/20"}>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.input}</td>
                  <td className="px-3 py-2">
                    {r.ok ? (
                      <div className="space-y-0.5 font-mono text-xs">
                        <div>
                          <span className="mr-2 text-muted-foreground">UTC</span>{r.utc}
                        </div>
                        <div>
                          <span className="mr-2 text-muted-foreground">Local</span>{r.local}
                        </div>
                        <div>
                          <span className="mr-2 text-muted-foreground">ts(s)</span>{r.ts}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-red-600 dark:text-red-400">{r.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
