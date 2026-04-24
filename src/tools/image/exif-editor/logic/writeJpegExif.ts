import piexif from "piexifjs";
import type { EditableFields } from "../types";

type IfdTable = Record<number, unknown>;
interface ExifObject {
  "0th"?: IfdTable;
  Exif?: IfdTable;
  GPS?: IfdTable;
  Interop?: IfdTable;
  "1st"?: IfdTable;
  thumbnail?: string | null;
}

const ImageIFD = piexif.ImageIFD;
const ExifIFD = piexif.ExifIFD;
const GPSIFD = piexif.GPSIFD;

export async function writeJpegExif(
  file: File,
  edits: EditableFields,
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const binary = arrayBufferToBinary(buffer);
  let exif: ExifObject;
  try {
    exif = piexif.load(binary) as ExifObject;
  } catch {
    exif = { "0th": {}, Exif: {}, GPS: {}, Interop: {}, "1st": {}, thumbnail: null };
  }
  applyEditsToExif(exif, edits);
  const exifStr = piexif.dump(exif);
  const inserted = piexif.insert(exifStr, binary);
  return binaryToBlob(inserted, "image/jpeg");
}

function applyEditsToExif(exif: ExifObject, edits: EditableFields): void {
  const zero: IfdTable = exif["0th"] ?? (exif["0th"] = {});
  const exifIfd: IfdTable = exif.Exif ?? (exif.Exif = {});

  setOrDelete(zero, ImageIFD.Model, edits.cameraModel.trim());
  setOrDelete(exifIfd, ExifIFD.LensModel, edits.lensModel.trim());
  setOrDelete(zero, ImageIFD.Copyright, edits.copyright.trim());

  const artist = edits.artist.trim();
  setOrDelete(zero, ImageIFD.Artist, artist);
  if (!artist) delete zero[ImageIFD.XPAuthor];

  const description = edits.description.trim();
  setOrDelete(zero, ImageIFD.ImageDescription, description);
  if (!description) {
    delete zero[ImageIFD.XPComment];
    delete zero[ImageIFD.XPSubject];
  }

  const title = edits.title.trim();
  if (title) {
    zero[ImageIFD.XPTitle] = encodeUtf16LeWithNull(title);
  } else {
    delete zero[ImageIFD.XPTitle];
  }

  const dateStr = editDateToExifString(edits.dateTimeOriginal);
  if (dateStr) {
    exifIfd[ExifIFD.DateTimeOriginal] = dateStr;
    exifIfd[ExifIFD.DateTimeDigitized] = dateStr;
    zero[ImageIFD.DateTime] = dateStr;
  } else if (edits.dateTimeOriginal === "") {
    delete exifIfd[ExifIFD.DateTimeOriginal];
    delete exifIfd[ExifIFD.DateTimeDigitized];
    delete zero[ImageIFD.DateTime];
  }

  applyGps(exif, edits.gpsLatitude, edits.gpsLongitude);
}

function applyGps(exif: ExifObject, latStr: string, lonStr: string): void {
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const hasLat = latStr.trim() !== "" && Number.isFinite(lat);
  const hasLon = lonStr.trim() !== "" && Number.isFinite(lon);
  if (!hasLat && !hasLon) {
    exif.GPS = {};
    return;
  }
  if (!hasLat || !hasLon) return;
  const gps: IfdTable = {};
  gps[GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
  gps[GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat));
  gps[GPSIFD.GPSLongitudeRef] = lon >= 0 ? "E" : "W";
  gps[GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lon));
  exif.GPS = gps;
}

function setOrDelete(ifd: IfdTable, tag: number, value: string): void {
  if (value) {
    ifd[tag] = value;
  } else {
    delete ifd[tag];
  }
}

function editDateToExifString(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function encodeUtf16LeWithNull(s: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    bytes.push(c & 0xff, (c >> 8) & 0xff);
  }
  bytes.push(0, 0);
  return bytes;
}

function arrayBufferToBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return binary;
}

function binaryToBlob(binary: string, mime: string): Blob {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return new Blob([bytes as BlobPart], { type: mime });
}

export type { ExifObject };
