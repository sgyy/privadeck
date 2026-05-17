"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Binary, CalendarClock, CalendarDays, Check, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CopyButton } from "@/components/shared/CopyButton";
import { PresetButtons } from "../components/PresetButtons";
import {
  formatTimestamp,
  parseDateString,
  parseTimestamp,
  toDateTimeLocalString,
  type FormatOutput,
  type TimestampUnit,
} from "../logic";

type UnitChoice = TimestampUnit | "auto";
type Direction = "ts2date" | "date2ts";

function deriveTsString(ms: number | null, unit: UnitChoice): string {
  if (ms == null) return "";
  const effectiveUnit: TimestampUnit = unit === "auto" ? "s" : unit;
  const msInt = Math.floor(ms);
  const msBig = BigInt(msInt);
  switch (effectiveUnit) {
    case "s": return String(Math.floor(ms / 1000));
    case "ms": return String(msInt);
    case "us": return (msBig * BigInt(1000)).toString();
    case "ns": return (msBig * BigInt(1000000)).toString();
  }
}

const UNIT_OPTIONS: { value: UnitChoice; labelKey: string }[] = [
  { value: "auto", labelKey: "unitAuto" },
  { value: "s", labelKey: "unitSeconds" },
  { value: "ms", labelKey: "unitMilliseconds" },
  { value: "us", labelKey: "unitMicroseconds" },
  { value: "ns", labelKey: "unitNanoseconds" },
];

function deriveInput(ms: number | null, direction: Direction, unit: UnitChoice, tz: string): string {
  if (ms == null) return "";
  return direction === "ts2date" ? deriveTsString(ms, unit) : toDateTimeLocalString(ms, tz);
}

export function SingleTab({
  tz,
  mainMs,
  setMainMs,
}: {
  tz: string;
  mainMs: number | null;
  setMainMs: (ms: number | null) => void;
}) {
  const t = useTranslations("tools.developer.timestamp");
  const [direction, setDirection] = useState<Direction>("ts2date");
  const [unit, setUnit] = useState<UnitChoice>("auto");
  const [inputValue, setInputValue] = useState<string>(() => deriveInput(mainMs, "ts2date", "auto", tz));
  const [error, setError] = useState("");
  const [lastSyncMs, setLastSyncMs] = useState<number | null>(mainMs);
  const pickerRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // External mainMs change (mount default / NowCard "Use this" / presets):
  // repopulate the input from mainMs. Self-emitted changes mark lastSyncMs in
  // the same handler so this guard skips them and never clobbers typing.
  if (mainMs !== lastSyncMs) {
    setLastSyncMs(mainMs);
    setInputValue(deriveInput(mainMs, direction, unit, tz));
    setError("");
  }

  const emit = useCallback((ms: number | null) => {
    setMainMs(ms);
    setLastSyncMs(ms);
  }, [setMainMs]);

  const parseInput = useCallback(
    (value: string, dir: Direction, u: UnitChoice): { ms: number | null; error: string } => {
      if (!value.trim()) return { ms: null, error: "" };
      try {
        const ms = dir === "ts2date" ? parseTimestamp(value, u).ms : parseDateString(value, tz);
        return { ms, error: "" };
      } catch {
        return { ms: null, error: dir === "ts2date" ? t("invalidTimestamp") : t("invalidDate") };
      }
    },
    [tz, t],
  );

  const applyInput = useCallback(
    (value: string) => {
      setInputValue(value);
      const { ms, error: err } = parseInput(value, direction, unit);
      setError(err);
      if (!err) emit(ms);
    },
    [direction, unit, parseInput, emit],
  );

  // Re-interpret current date input when the selected timezone changes
  // (tz-naive strings map to a different instant). ts2date only re-formats output.
  useEffect(() => {
    if (direction !== "date2ts" || !inputValue.trim()) return;
    const { ms, error: err } = parseInput(inputValue, "date2ts", unit);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(err);
    if (!err) emit(ms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tz]);

  const switchDirection = useCallback(
    (next: Direction) => {
      if (next === direction) return;
      setDirection(next);
      setError("");
      setInputValue(deriveInput(mainMs, next, unit, tz));
    },
    [direction, mainMs, unit, tz],
  );

  const handleUnitChange = useCallback(
    (u: UnitChoice) => {
      setUnit(u);
      // Re-interpret the SAME typed string under the new unit; never rewrite it.
      if (direction === "ts2date" && inputValue.trim()) {
        const { ms, error: err } = parseInput(inputValue, "ts2date", u);
        setError(err);
        if (!err) emit(ms);
      }
    },
    [direction, inputValue, parseInput, emit],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setError("");
    emit(null);
  }, [emit]);

  const openPicker = useCallback(() => {
    const el = pickerRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      try {
        withPicker.showPicker();
        return;
      } catch {
        /* fall through to focus */
      }
    }
    el.focus();
    el.click();
  }, []);

  const output = useMemo<FormatOutput | null>(() => {
    if (mainMs == null) return null;
    try {
      return formatTimestamp(mainMs, tz);
    } catch {
      return null;
    }
  }, [mainMs, tz]);

  const primaryResult = useMemo(() => {
    if (mainMs == null || !output) return "";
    return direction === "ts2date" ? output.dateTime : deriveTsString(mainMs, unit);
  }, [mainMs, output, direction, unit]);

  const showResult = !error && mainMs != null && !!primaryResult;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <Button
            variant={direction === "ts2date" ? "primary" : "outline"}
            size="sm"
            onClick={() => switchDirection("ts2date")}
          >
            {t("directionTsToDate")}
          </Button>
          <Button
            variant={direction === "date2ts" ? "primary" : "outline"}
            size="sm"
            onClick={() => switchDirection("date2ts")}
          >
            {t("directionDateToTs")}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => switchDirection(direction === "ts2date" ? "date2ts" : "ts2date")}
          title={t("swap")}
          aria-label={t("swap")}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {t("swap")}
        </Button>
      </div>

      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {direction === "ts2date" ? t("timestampLabel") : t("dateLabel")}
        </label>
        <div className="flex gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-lg border-2 border-border bg-muted/60 px-3 transition-colors hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/50">
            {direction === "ts2date" ? (
              <Binary className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : (
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <input
              id={inputId}
              type="text"
              inputMode={direction === "ts2date" ? "numeric" : "text"}
              value={inputValue}
              onChange={(e) => applyInput(e.target.value)}
              placeholder={direction === "ts2date" ? t("timestampPlaceholder") : t("dateInputPlaceholder")}
              className="w-full bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          {direction === "date2ts" && (
            <span className="relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={openPicker}
                title={t("pickDate")}
                aria-label={t("pickDate")}
                className="h-12 w-12"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
              <input
                ref={pickerRef}
                type="datetime-local"
                step="1"
                value={mainMs != null ? toDateTimeLocalString(mainMs, tz) : ""}
                onChange={(e) => {
                  if (e.target.value) applyInput(e.target.value);
                }}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
              />
            </span>
          )}
          <Select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as UnitChoice)}
            aria-label={t("unit")}
            className="h-12 shrink-0"
          >
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <Eraser className="h-3.5 w-3.5" />
          {t("clearInput")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {showResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{t("resultLabel")}</span>
            <CopyButton
              text={primaryResult}
              analyticsSlug="timestamp"
              analyticsCategory="developer"
            />
          </div>
          <div className="font-mono text-lg break-all text-foreground select-all">
            {primaryResult}
          </div>
        </div>
      )}

      <PresetButtons tz={tz} currentMs={mainMs} onChange={(ms) => setMainMs(ms)} />

      {!error && output && <OutputTable output={output} />}
    </div>
  );
}

function OutputTable({ output }: { output: FormatOutput }) {
  const primary: { labelKey: string; value: string }[] = [
    { labelKey: "tsSeconds", value: output.ts.s },
    { labelKey: "tsMilliseconds", value: output.ts.ms },
    { labelKey: "localFormat", value: output.local },
    { labelKey: "utcFormat", value: output.utc },
    { labelKey: "isoFormat", value: output.iso },
    { labelKey: "relativeFormat", value: output.relative },
  ];
  const detail: { labelKey: string; value: string }[] = [
    { labelKey: "tsMicroseconds", value: output.ts.us },
    { labelKey: "tsNanoseconds", value: output.ts.ns },
    { labelKey: "formatRfc2822", value: output.rfc2822 },
    { labelKey: "formatDateTime", value: output.dateTime },
    { labelKey: "formatDayOfYear", value: String(output.dayOfYear) },
    { labelKey: "formatIsoWeek", value: String(output.isoWeek) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <OutputColumn rows={primary} />
      <OutputColumn rows={detail} />
    </div>
  );
}

function OutputColumn({ rows }: { rows: { labelKey: string; value: string }[] }) {
  const t = useTranslations("tools.developer.timestamp");
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-muted/30">
      {rows.map((r) => (
        <div key={r.labelKey} className="flex items-center gap-3 px-3 py-1.5">
          <div className="w-24 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t(r.labelKey)}
          </div>
          <div className="min-w-0 flex-1 truncate font-mono text-sm" title={r.value}>
            {r.value}
          </div>
          <RowCopy text={r.value} />
        </div>
      ))}
    </div>
  );
}

function RowCopy({ text }: { text: string }) {
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={tc(copied ? "copied" : "copy")}
      aria-label={tc(copied ? "copied" : "copy")}
      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
