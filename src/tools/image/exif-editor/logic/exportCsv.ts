import type { ExifRecord } from "../types";

export function exportCsv(record: ExifRecord): Blob {
  const rows: Array<[string, string]> = [["Key", "Value"]];
  rows.push(["__filename", record.sourceFile.name]);
  rows.push(["__mimeType", record.mimeType]);
  rows.push(["__size", String(record.sourceFile.size)]);
  flatten("", record.raw, rows);
  const csv = rows.map(([k, v]) => `${escapeCell(k)},${escapeCell(v)}`).join("\r\n");
  return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
}

export function csvFilename(record: ExifRecord): string {
  const base = record.sourceFile.name.replace(/\.[^.]+$/, "");
  return `${base}.exif.csv`;
}

function flatten(prefix: string, value: unknown, rows: Array<[string, string]>): void {
  if (value === null || value === undefined) return;
  if (value instanceof Date) {
    rows.push([prefix, Number.isNaN(value.getTime()) ? "" : value.toISOString()]);
    return;
  }
  if (value instanceof Uint8Array) {
    const preview = Array.from(value.slice(0, 32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    rows.push([prefix, `[${value.length} bytes] ${preview}${value.length > 32 ? " …" : ""}`]);
    return;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v !== "object" || v === null)) {
      rows.push([prefix, value.map((v) => stringify(v)).join("; ")]);
    } else {
      value.forEach((v, i) => flatten(`${prefix}[${i}]`, v, rows));
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      flatten(key, v, rows);
    }
    return;
  }
  rows.push([prefix, stringify(value)]);
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toString() : "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function escapeCell(s: string): string {
  if (s === undefined || s === null) return "";
  const needsQuote = /[",\r\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
