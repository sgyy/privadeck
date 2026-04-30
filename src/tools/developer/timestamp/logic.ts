import { LOCAL_TZ_VALUE, MAX_BATCH_LINES } from "./constants";

export type TimestampUnit = "s" | "ms" | "us" | "ns";

export interface FormatOutput {
  ms: number;
  ts: { s: string; ms: string; us: string; ns: string };
  utc: string;
  local: string;
  iso: string;
  rfc2822: string;
  dateTime: string;
  dayOfYear: number;
  isoWeek: number;
  relative: string;
}

const SAFE_MS_MIN = -8_640_000_000_000_000;
const SAFE_MS_MAX = 8_640_000_000_000_000;

function isFiniteMs(ms: number): boolean {
  return Number.isFinite(ms) && ms >= SAFE_MS_MIN && ms <= SAFE_MS_MAX;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function resolveTz(tz: string): string | undefined {
  return tz === LOCAL_TZ_VALUE ? undefined : tz;
}

function getRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const absSec = Math.abs(diffMs) / 1000;
  try {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), "second");
    if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), "minute");
    if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), "hour");
    if (absSec < 2592000) return rtf.format(Math.round(diffMs / 86400000), "day");
    if (absSec < 31536000) return rtf.format(Math.round(diffMs / 2592000000), "month");
    return rtf.format(Math.round(diffMs / 31536000000), "year");
  } catch {
    const isPast = diffMs < 0;
    const days = Math.floor(absSec / 86400);
    const hours = Math.floor(absSec / 3600);
    const minutes = Math.floor(absSec / 60);
    const v = absSec < 60 ? `${Math.floor(absSec)}s` : minutes < 60 ? `${minutes}m` : hours < 24 ? `${hours}h` : `${days}d`;
    return isPast ? `${v} ago` : `in ${v}`;
  }
}

export function nowMs(): number {
  return Date.now();
}

export function adjustMs(ms: number, deltaMs: number): number {
  return ms + deltaMs;
}

export function parseTimestamp(input: string, unit: TimestampUnit | "auto"): { ms: number; detectedUnit: TimestampUnit } {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty timestamp");
  const num = Number(trimmed);
  if (!Number.isFinite(num)) throw new Error("Invalid timestamp");

  let detected: TimestampUnit;
  if (unit !== "auto") {
    detected = unit;
  } else {
    const abs = Math.abs(num);
    if (abs >= 1e16) detected = "ns";
    else if (abs >= 1e13) detected = "us";
    else if (abs >= 1e10) detected = "ms";
    else detected = "s";
  }

  let ms: number;
  switch (detected) {
    case "s": ms = num * 1000; break;
    case "ms": ms = num; break;
    case "us": ms = num / 1000; break;
    case "ns": ms = num / 1_000_000; break;
  }

  if (!isFiniteMs(ms)) throw new Error("Timestamp out of range");
  return { ms, detectedUnit: detected };
}

function formatInTz(date: Date, tz: string | undefined, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: tz }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", opts).format(date);
  }
}

function getTzParts(date: Date, tz: string | undefined): Record<string, string> {
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
      weekday: "short",
    }).formatToParts(date);
    const out: Record<string, string> = {};
    for (const p of parts) out[p.type] = p.value;
    return out;
  } catch {
    return {
      year: String(date.getFullYear()),
      month: pad(date.getMonth() + 1),
      day: pad(date.getDate()),
      hour: pad(date.getHours()),
      minute: pad(date.getMinutes()),
      second: pad(date.getSeconds()),
      weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getDay()],
    };
  }
}

function formatRfc2822(date: Date, tz: string | undefined): string {
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let dow: number, da: number, mo: number, y: number, h: number, mi: number, se: number, offsetMin: number;
  if (!tz) {
    dow = date.getDay();
    da = date.getDate();
    mo = date.getMonth();
    y = date.getFullYear();
    h = date.getHours();
    mi = date.getMinutes();
    se = date.getSeconds();
    offsetMin = -date.getTimezoneOffset();
  } else {
    const parts = getTzParts(date, tz);
    y = Number(parts.year);
    mo = Number(parts.month) - 1;
    da = Number(parts.day);
    h = Number(parts.hour);
    if (h === 24) h = 0;
    mi = Number(parts.minute);
    se = Number(parts.second);
    const wIdx = dayNames.indexOf(parts.weekday);
    dow = wIdx >= 0 ? wIdx : 0;
    offsetMin = Math.round(getTzOffsetMs(date, tz) / 60000);
  }
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offset = `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
  return `${dayNames[dow]}, ${pad(da)} ${monthNames[mo]} ${y} ${pad(h)}:${pad(mi)}:${pad(se)} ${offset}`;
}

function getDayOfYearInTz(date: Date, tz: string | undefined): number {
  const parts = getTzParts(date, tz);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const startOfYearUtc = Date.UTC(year, 0, 1);
  const dateUtc = Date.UTC(year, month - 1, day);
  return Math.floor((dateUtc - startOfYearUtc) / 86400000) + 1;
}

function getIsoWeekInTz(date: Date, tz: string | undefined): number {
  const parts = getTzParts(date, tz);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const target = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayOfWeek + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDow = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDow + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
}

export function formatTimestamp(ms: number, tz: string): FormatOutput {
  const date = new Date(ms);
  if (isNaN(date.getTime())) throw new Error("Invalid timestamp");
  const resolvedTz = resolveTz(tz);

  const msInt = Math.floor(ms);
  const msBig = BigInt(msInt);
  const sStr = Math.floor(ms / 1000).toString();
  const msStr = msInt.toString();
  const usStr = (msBig * BigInt(1000)).toString();
  const nsStr = (msBig * BigInt(1000000)).toString();

  const local = formatInTz(date, resolvedTz, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });

  const parts = getTzParts(date, resolvedTz);
  const hourStr = parts.hour === "24" ? "00" : parts.hour;
  const dateTime = `${parts.year}-${parts.month}-${parts.day} ${hourStr}:${parts.minute}:${parts.second}`;

  return {
    ms,
    ts: { s: sStr, ms: msStr, us: usStr, ns: nsStr },
    utc: date.toUTCString(),
    local,
    iso: date.toISOString(),
    rfc2822: formatRfc2822(date, resolvedTz),
    dateTime,
    dayOfYear: getDayOfYearInTz(date, resolvedTz),
    isoWeek: getIsoWeekInTz(date, resolvedTz),
    relative: getRelativeTime(date),
  };
}

export type Preset = "now" | "today" | "yesterday" | "tomorrow" | "monthStart" | "yearStart";

export function getPreset(preset: Preset, tz: string): number {
  const now = new Date();
  if (preset === "now") return now.getTime();
  const resolvedTz = resolveTz(tz);
  const parts = getTzParts(now, resolvedTz);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  let baseUtc: number;
  switch (preset) {
    case "today":
      baseUtc = Date.UTC(year, month - 1, day);
      break;
    case "yesterday":
      baseUtc = Date.UTC(year, month - 1, day - 1);
      break;
    case "tomorrow":
      baseUtc = Date.UTC(year, month - 1, day + 1);
      break;
    case "monthStart":
      baseUtc = Date.UTC(year, month - 1, 1);
      break;
    case "yearStart":
      baseUtc = Date.UTC(year, 0, 1);
      break;
  }
  // Use the offset of the *target* date, not "now". Otherwise yesterday/tomorrow
  // skews by 1h on DST transition days.
  const probe = new Date(baseUtc);
  const offsetMs = resolvedTz ? getTzOffsetMs(probe, resolvedTz) : -probe.getTimezoneOffset() * 60 * 1000;
  return baseUtc - offsetMs;
}

function getTzOffsetMs(date: Date, tz: string): number {
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
    }).formatToParts(date);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type === "year" || p.type === "month" || p.type === "day" || p.type === "hour" || p.type === "minute" || p.type === "second") {
        map[p.type] = Number(p.value);
      }
    }
    const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour === 24 ? 0 : map.hour, map.minute, map.second);
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
}

export interface BatchRow {
  input: string;
  ok: boolean;
  ms?: number;
  ts?: number;
  utc?: string;
  local?: string;
  iso?: string;
  error?: string;
}

export function processBatch(
  text: string,
  mode: "auto" | "timestamp" | "date",
  unit: TimestampUnit | "auto",
  tz: string,
): BatchRow[] {
  const rows: BatchRow[] = [];
  const lines = text.split(/\r?\n/);
  const limit = Math.min(lines.length, MAX_BATCH_LINES);
  for (let i = 0; i < limit; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      let ms: number;
      if (mode === "timestamp" || (mode === "auto" && /^-?\d+(\.\d+)?$/.test(trimmed))) {
        ms = parseTimestamp(trimmed, unit).ms;
      } else {
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) throw new Error("Invalid date");
        ms = d.getTime();
      }
      const f = formatTimestamp(ms, tz);
      rows.push({ input: trimmed, ok: true, ms, ts: Math.floor(ms / 1000), utc: f.utc, local: f.local, iso: f.iso });
    } catch (e) {
      rows.push({ input: trimmed, ok: false, error: e instanceof Error ? e.message : "Invalid input" });
    }
  }
  return rows;
}

function csvEscape(field: string): string {
  let v = field;
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  if (/[",\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
  return v;
}

export function batchToCsv(rows: BatchRow[]): string {
  const header = ["input", "ok", "timestamp_s", "timestamp_ms", "utc", "local", "iso", "error"];
  const out = [header.join(",")];
  for (const r of rows) {
    out.push([
      csvEscape(r.input),
      r.ok ? "true" : "false",
      csvEscape(r.ts != null ? String(r.ts) : ""),
      csvEscape(r.ms != null ? String(r.ms) : ""),
      csvEscape(r.utc ?? ""),
      csvEscape(r.local ?? ""),
      csvEscape(r.iso ?? ""),
      csvEscape(r.error ?? ""),
    ].join(","));
  }
  return out.join("\r\n");
}

export interface JwtTimestamps {
  ok: boolean;
  iat?: number;
  nbf?: number;
  exp?: number;
  iatFmt?: FormatOutput;
  nbfFmt?: FormatOutput;
  expFmt?: FormatOutput;
  expired?: boolean;
  notYetValid?: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const decoded = atob(s);
  try {
    return decodeURIComponent(
      Array.from(decoded)
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
  } catch {
    return decoded;
  }
}

export function parseJwt(token: string, tz: string): JwtTimestamps {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "Empty token" };
  const parts = trimmed.split(".");
  if (parts.length < 2) return { ok: false, error: "Invalid JWT structure" };
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Cannot decode JWT payload" };
  }
  const result: JwtTimestamps = { ok: true, payload };
  const readNum = (key: string): number | undefined => {
    const v = payload[key];
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  const iat = readNum("iat");
  const nbf = readNum("nbf");
  const exp = readNum("exp");
  const nowSec = Math.floor(Date.now() / 1000);
  if (iat != null) {
    result.iat = iat;
    try { result.iatFmt = formatTimestamp(iat * 1000, tz); } catch { /* ignore */ }
  }
  if (nbf != null) {
    result.nbf = nbf;
    try { result.nbfFmt = formatTimestamp(nbf * 1000, tz); } catch { /* ignore */ }
    result.notYetValid = nowSec < nbf;
  }
  if (exp != null) {
    result.exp = exp;
    try { result.expFmt = formatTimestamp(exp * 1000, tz); } catch { /* ignore */ }
    result.expired = nowSec >= exp;
  }
  return result;
}

export function generateCodeSnippets(seconds: number): {
  python: string;
  javascript: string;
  go: string;
  bash: string;
  sql: string;
} {
  return {
    python: `from datetime import datetime, timezone

ts = ${seconds}
dt = datetime.fromtimestamp(ts, tz=timezone.utc)
print(dt.isoformat())`,
    javascript: `const ts = ${seconds};
const date = new Date(ts * 1000);
console.log(date.toISOString());`,
    go: `package main

import (
\t"fmt"
\t"time"
)

func main() {
\tts := int64(${seconds})
\tt := time.Unix(ts, 0).UTC()
\tfmt.Println(t.Format(time.RFC3339))
}`,
    bash: `# GNU date (Linux)
date -u -d @${seconds} +"%Y-%m-%dT%H:%M:%SZ"

# BSD date (macOS)
date -u -r ${seconds} +"%Y-%m-%dT%H:%M:%SZ"`,
    sql: `-- PostgreSQL
SELECT to_timestamp(${seconds});

-- MySQL
SELECT FROM_UNIXTIME(${seconds});

-- SQLite
SELECT datetime(${seconds}, 'unixepoch');`,
  };
}
