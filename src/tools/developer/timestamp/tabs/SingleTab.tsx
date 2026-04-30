"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { CopyButton } from "@/components/shared/CopyButton";
import { PresetButtons } from "../components/PresetButtons";
import { formatTimestamp, parseTimestamp, type FormatOutput, type TimestampUnit } from "../logic";

type UnitChoice = TimestampUnit | "auto";

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

function toDateTimeLocalString(ms: number, tz: string): string {
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "";
  if (tz === "__local__") {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    const hour = map.hour === "24" ? "00" : map.hour;
    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}`;
  } catch {
    return "";
  }
}

function dateTimeLocalStringToMs(value: string, tz: string): number {
  if (!value) return NaN;
  if (tz === "__local__") {
    const d = new Date(value);
    return d.getTime();
  }
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    const d = new Date(value);
    return d.getTime();
  }
  const [, y, mo, da, h, mi, se] = m;
  const asUtc = Date.UTC(Number(y), Number(mo) - 1, Number(da), Number(h), Number(mi), Number(se ?? "0"));
  try {
    const probe = new Date(asUtc);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(probe);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (["year", "month", "day", "hour", "minute", "second"].includes(p.type)) {
        map[p.type] = Number(p.value);
      }
    }
    const probeAsUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour === 24 ? 0 : map.hour, map.minute, map.second);
    const offsetMs = probeAsUtc - asUtc;
    return asUtc - offsetMs;
  } catch {
    return new Date(value).getTime();
  }
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
  const [unit, setUnit] = useState<UnitChoice>("auto");
  const [tsInput, setTsInput] = useState<string>(() => deriveTsString(mainMs, "auto"));
  const [dateInput, setDateInput] = useState<string>(() => mainMs != null ? toDateTimeLocalString(mainMs, tz) : "");
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<{ mainMs: number | null; unit: UnitChoice; tz: string }>({ mainMs, unit, tz });

  if (lastSync.mainMs !== mainMs || lastSync.unit !== unit || lastSync.tz !== tz) {
    setLastSync({ mainMs, unit, tz });
    setTsInput(deriveTsString(mainMs, unit));
    setDateInput(mainMs != null ? toDateTimeLocalString(mainMs, tz) : "");
    setError("");
  }

  function handleTsChange(value: string) {
    setTsInput(value);
    if (!value.trim()) {
      setMainMs(null);
      setError("");
      return;
    }
    try {
      const { ms } = parseTimestamp(value, unit);
      setMainMs(ms);
      setError("");
    } catch {
      setError(t("invalidTimestamp"));
    }
  }

  function handleDateChange(value: string) {
    setDateInput(value);
    if (!value) {
      setMainMs(null);
      setError("");
      return;
    }
    const ms = dateTimeLocalStringToMs(value, tz);
    if (isNaN(ms)) {
      setError(t("invalidDate"));
      return;
    }
    setMainMs(ms);
    setError("");
  }

  const output = useMemo<FormatOutput | null>(() => {
    if (mainMs == null) return null;
    try {
      return formatTimestamp(mainMs, tz);
    } catch {
      return null;
    }
  }, [mainMs, tz]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("timestampLabel")}</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={tsInput}
              onChange={(e) => handleTsChange(e.target.value)}
              placeholder={t("timestampPlaceholder")}
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
            />
            <Select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitChoice)}
              aria-label={t("unit")}
              className="shrink-0"
            >
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </Select>
          </div>
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

      <PresetButtons tz={tz} currentMs={mainMs} onChange={(ms) => setMainMs(ms)} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {output && <OutputTable output={output} />}
    </div>
  );
}

function OutputTable({ output }: { output: FormatOutput }) {
  const t = useTranslations("tools.developer.timestamp");
  const rows: { labelKey: string; value: string }[] = [
    { labelKey: "tsSeconds", value: output.ts.s },
    { labelKey: "tsMilliseconds", value: output.ts.ms },
    { labelKey: "tsMicroseconds", value: output.ts.us },
    { labelKey: "tsNanoseconds", value: output.ts.ns },
    { labelKey: "utcFormat", value: output.utc },
    { labelKey: "localFormat", value: output.local },
    { labelKey: "isoFormat", value: output.iso },
    { labelKey: "formatRfc2822", value: output.rfc2822 },
    { labelKey: "formatDateTime", value: output.dateTime },
    { labelKey: "formatDayOfYear", value: String(output.dayOfYear) },
    { labelKey: "formatIsoWeek", value: String(output.isoWeek) },
    { labelKey: "relativeFormat", value: output.relative },
  ];

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-muted/30">
      {rows.map((r) => (
        <div key={r.labelKey} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t(r.labelKey)}
            </div>
            <div className="break-all font-mono text-sm">{r.value}</div>
          </div>
          <CopyButton text={r.value} className="shrink-0" />
        </div>
      ))}
    </div>
  );
}
