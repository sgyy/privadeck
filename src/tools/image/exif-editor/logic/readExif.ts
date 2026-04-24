import exifr from "exifr";
import type { ExifRecord, ExifNormalized, GpsCoords } from "../types";
import { isWriteableMime } from "../types";

const PARSE_OPTIONS = {
  tiff: true,
  exif: true,
  gps: true,
  iptc: true,
  xmp: true,
  icc: false,
  jfif: false,
  ihdr: false,
  mergeOutput: true,
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
} as const;

export async function readExif(file: File): Promise<ExifRecord> {
  const buffer = await file.arrayBuffer();
  let raw: Record<string, unknown> = {};
  try {
    const parsed = await exifr.parse(buffer, PARSE_OPTIONS);
    if (parsed && typeof parsed === "object") {
      raw = { ...parsed } as Record<string, unknown>;
    }
  } catch {
    raw = {};
  }

  const mimeType = file.type || guessMimeFromName(file.name);
  const writeable = isWriteableMime(mimeType);
  const normalized = normalize(raw);
  return {
    sourceFile: file,
    mimeType,
    writeable,
    raw,
    normalized,
  };
}

function guessMimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
    tif: "image/tiff",
    tiff: "image/tiff",
  };
  return map[ext] ?? "";
}

function normalize(raw: Record<string, unknown>): ExifNormalized {
  const n: ExifNormalized = {};
  n.make = readString(raw, "Make");
  n.model = readString(raw, "Model");
  n.software = readString(raw, "Software");
  n.lensMake = readString(raw, "LensMake");
  n.lensModel = readString(raw, "LensModel", "Lens", "LensID");
  n.focalLength = readNumber(raw, "FocalLength");
  n.focalLengthIn35mm = readNumber(raw, "FocalLengthIn35mmFormat");
  n.dateTimeOriginal = readDate(raw, "DateTimeOriginal", "CreateDate");
  n.dateTimeDigitized = readDate(raw, "DateTimeDigitized");
  n.dateTime = readDate(raw, "ModifyDate", "DateTime");
  n.gps = readGps(raw);
  n.artist = readString(raw, "Artist", "Creator", "By-line");
  n.copyright = readString(raw, "Copyright", "Rights");
  n.title = readString(raw, "XPTitle", "Title", "ObjectName");
  n.description =
    readString(raw, "ImageDescription", "Description", "Caption-Abstract") ??
    readString(raw, "XPComment", "XPSubject");
  n.keywords = readKeywords(raw);
  n.iso = readNumber(raw, "ISO", "ISOSpeedRatings");
  n.fNumber = readNumber(raw, "FNumber", "ApertureValue");
  n.exposureTime = readNumber(raw, "ExposureTime");
  n.flash = readString(raw, "Flash");
  n.whiteBalance = readString(raw, "WhiteBalance");
  n.orientation =
    typeof raw.Orientation === "number" ? (raw.Orientation as number) : undefined;
  n.colorSpace = readString(raw, "ColorSpace");
  n.imageWidth = readNumber(raw, "ExifImageWidth", "ImageWidth", "PixelXDimension");
  n.imageHeight = readNumber(raw, "ExifImageHeight", "ImageHeight", "PixelYDimension");
  return n;
}

function readString(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") {
      return v.map((x) => String(x)).join(", ");
    }
  }
  return undefined;
}

function readNumber(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v !== "") {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function readDate(raw: Record<string, unknown>, ...keys: string[]): Date | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
    if (typeof v === "string" && v !== "") {
      const parsed = new Date(v);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  return undefined;
}

function readGps(raw: Record<string, unknown>): GpsCoords | undefined {
  const lat = readNumber(raw, "latitude", "GPSLatitude");
  const lon = readNumber(raw, "longitude", "GPSLongitude");
  if (lat === undefined || lon === undefined) return undefined;
  const alt = readNumber(raw, "GPSAltitude", "altitude");
  return { latitude: lat, longitude: lon, altitude: alt };
}

function readKeywords(raw: Record<string, unknown>): string[] | undefined {
  const v = raw["Keywords"] ?? raw["XPKeywords"] ?? raw["subject"];
  if (Array.isArray(v)) {
    return v.map((x) => String(x)).filter((s) => s.length > 0);
  }
  if (typeof v === "string" && v !== "") {
    return v.split(/[;,]/).map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return undefined;
}
