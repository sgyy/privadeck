"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { timestampToDate, dateToTimestamp, nowTimestamp } from "./logic";

export default function Timestamp() {
  const t = useTranslations("tools.developer.timestamp");
  const [timestampInput, setTimestampInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [utc, setUtc] = useState("");
  const [local, setLocal] = useState("");
  const [iso, setIso] = useState("");
  const [relative, setRelative] = useState("");
  const [error, setError] = useState("");

  const clearResults = useCallback(() => {
    setUtc("");
    setLocal("");
    setIso("");
    setRelative("");
    setError("");
  }, []);

  function handleSetNow() {
    const now = nowTimestamp();
    setTimestampInput(String(now.seconds));
    try {
      const result = timestampToDate(now.seconds);
      setUtc(result.utc);
      setLocal(result.local);
      setIso(result.iso);
      setRelative(result.relative);
      // Format for datetime-local input
      const d = result.date;
      const pad = (n: number) => String(n).padStart(2, "0");
      setDateInput(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      );
      setError("");
    } catch {
      clearResults();
    }
  }

  useEffect(() => {
    handleSetNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTimestampChange(value: string) {
    setTimestampInput(value);
    if (!value.trim()) {
      clearResults();
      setDateInput("");
      return;
    }
    const num = Number(value);
    if (isNaN(num)) {
      setError(t("invalidTimestamp"));
      return;
    }
    try {
      // Auto-detect: if > 1e12, treat as milliseconds
      const isMs = Math.abs(num) > 1e12;
      const result = timestampToDate(num, isMs);
      setUtc(result.utc);
      setLocal(result.local);
      setIso(result.iso);
      setRelative(result.relative);
      const d = result.date;
      const pad = (n: number) => String(n).padStart(2, "0");
      setDateInput(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      );
      setError("");
    } catch {
      setError(t("invalidTimestamp"));
    }
  }

  function handleDateChange(value: string) {
    setDateInput(value);
    if (!value) {
      clearResults();
      setTimestampInput("");
      return;
    }
    try {
      const result = dateToTimestamp(value);
      setTimestampInput(String(result.seconds));
      const ts = timestampToDate(result.seconds);
      setUtc(ts.utc);
      setLocal(ts.local);
      setIso(ts.iso);
      setRelative(ts.relative);
      setError("");
    } catch {
      setError(t("invalidDate"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("timestampLabel")}</label>
          <input
            type="number"
            value={timestampInput}
            onChange={(e) => handleTimestampChange(e.target.value)}
            placeholder={t("timestampPlaceholder")}
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("dateLabel")}</label>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => handleDateChange(e.target.value)}
            step="1"
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <Button variant="secondary" onClick={handleSetNow}>
          {t("now")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {utc && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("utcFormat")}</div>
              <div className="font-mono text-sm">{utc}</div>
            </div>
            <CopyButton text={utc} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("localFormat")}</div>
              <div className="font-mono text-sm">{local}</div>
            </div>
            <CopyButton text={local} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("isoFormat")}</div>
              <div className="font-mono text-sm">{iso}</div>
            </div>
            <CopyButton text={iso} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("relativeFormat")}</div>
              <div className="font-mono text-sm">{relative}</div>
            </div>
            <CopyButton text={relative} />
          </div>
        </div>
      )}
    </div>
  );
}
