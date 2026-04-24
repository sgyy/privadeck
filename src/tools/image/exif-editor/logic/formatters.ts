export function formatFNumber(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  return `f/${value.toFixed(1).replace(/\.0$/, "")}`;
}

export function formatExposureTime(value?: number): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return "";
  if (value >= 1) return `${value}s`;
  const denominator = Math.round(1 / value);
  return `1/${denominator}s`;
}

export function formatFocalLength(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  return `${Math.round(value * 10) / 10}mm`;
}

export function formatIso(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  return `ISO ${Math.round(value)}`;
}

export function formatDate(value?: Date): string {
  if (!value || Number.isNaN(value.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

export function formatGpsDms(decimal: number, axis: "lat" | "lon"): string {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  const hemisphere =
    axis === "lat" ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";
  return `${degrees}°${minutes.toString().padStart(2, "0")}'${seconds.toFixed(2).padStart(5, "0")}"${hemisphere}`;
}

export function formatGpsDecimal(
  latitude: number,
  longitude: number,
): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function formatAltitude(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  return `${value.toFixed(1)}m`;
}

export function buildOsmUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
}

export function buildGoogleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function buildBingMapsUrl(lat: number, lon: number): string {
  return `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=15&sp=point.${lat}_${lon}_`;
}

export function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return value.toString();
  }
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Uint8Array) {
    const len = value.length;
    const preview = Array.from(value.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    return `[${len} bytes] ${preview}${len > 16 ? " …" : ""}`;
  }
  if (Array.isArray(value)) {
    return value.map((v) => formatFieldValue(v)).join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
