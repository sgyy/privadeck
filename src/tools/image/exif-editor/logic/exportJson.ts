import type { ExifRecord } from "../types";

export function exportJson(record: ExifRecord): Blob {
  const payload = {
    filename: record.sourceFile.name,
    mimeType: record.mimeType,
    size: record.sourceFile.size,
    exif: sanitizeForJson(record.raw),
  };
  const text = JSON.stringify(payload, null, 2);
  return new Blob([text], { type: "application/json" });
}

export function jsonFilename(record: ExifRecord): string {
  const base = record.sourceFile.name.replace(/\.[^.]+$/, "");
  return `${base}.exif.json`;
}

function sanitizeForJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (value instanceof Uint8Array) {
    const MAX = 256;
    const truncated = value.length > MAX ? value.slice(0, MAX) : value;
    const hex = Array.from(truncated)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return {
      __type: "bytes",
      length: value.length,
      hex: value.length > MAX ? `${hex}…` : hex,
    };
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForJson);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeForJson(v);
    }
    return out;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  return value;
}
