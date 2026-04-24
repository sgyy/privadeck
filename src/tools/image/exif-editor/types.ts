export interface GpsCoords {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface ExifNormalized {
  make?: string;
  model?: string;
  software?: string;
  lensMake?: string;
  lensModel?: string;
  focalLength?: number;
  focalLengthIn35mm?: number;
  dateTimeOriginal?: Date;
  dateTimeDigitized?: Date;
  dateTime?: Date;
  gps?: GpsCoords;
  artist?: string;
  copyright?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  iso?: number;
  fNumber?: number;
  exposureTime?: number;
  flash?: string;
  whiteBalance?: string;
  orientation?: number;
  colorSpace?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface ExifRecord {
  sourceFile: File;
  mimeType: string;
  writeable: boolean;
  raw: Record<string, unknown>;
  normalized: ExifNormalized;
}

export interface EditableFields {
  dateTimeOriginal: string;
  gpsLatitude: string;
  gpsLongitude: string;
  cameraModel: string;
  lensModel: string;
  artist: string;
  copyright: string;
  title: string;
  description: string;
}

export function isWriteableMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

export function resolveMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
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

export function emptyEditableFields(): EditableFields {
  return {
    dateTimeOriginal: "",
    gpsLatitude: "",
    gpsLongitude: "",
    cameraModel: "",
    lensModel: "",
    artist: "",
    copyright: "",
    title: "",
    description: "",
  };
}

export function editableFieldsFromRecord(r: ExifRecord): EditableFields {
  const n = r.normalized;
  const dt = n.dateTimeOriginal;
  const datetimeLocal = dt ? toDatetimeLocalString(dt) : "";
  return {
    dateTimeOriginal: datetimeLocal,
    gpsLatitude: n.gps ? String(n.gps.latitude) : "",
    gpsLongitude: n.gps ? String(n.gps.longitude) : "",
    cameraModel: n.model ?? "",
    lensModel: n.lensModel ?? "",
    artist: n.artist ?? "",
    copyright: n.copyright ?? "",
    title: n.title ?? "",
    description: n.description ?? "",
  };
}

function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
