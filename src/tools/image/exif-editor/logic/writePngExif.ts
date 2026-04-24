import piexif from "piexifjs";
import type { EditableFields } from "../types";
import type { ExifObject } from "./writeJpegExif";

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const EXIF_HEADER = "Exif\x00\x00";

export async function writePngExif(
  file: File,
  edits: EditableFields,
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!hasPngSignature(bytes)) {
    throw new Error("Not a valid PNG file");
  }
  const existingTiff = extractExistingTiffFromPng(bytes);
  const exifObj: ExifObject = existingTiff
    ? (piexif.load(EXIF_HEADER + existingTiff) as ExifObject)
    : { "0th": {}, Exif: {}, GPS: {}, Interop: {}, "1st": {}, thumbnail: null };

  applyEdits(exifObj, edits);
  const newTiff = dumpTiffPayload(exifObj);
  return rebuildPngWithExif(bytes, newTiff);
}

function hasPngSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) return false;
  }
  return true;
}

function extractExistingTiffFromPng(bytes: Uint8Array): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const len = view.getUint32(offset);
    const type = readAscii(bytes, offset + 4, 4);
    if (offset + 12 + len > bytes.length) break;
    if (type === "eXIf") {
      const start = offset + 8;
      return bytesToBinary(bytes.subarray(start, start + len));
    }
    offset += 12 + len;
  }
  return null;
}

function rebuildPngWithExif(bytes: Uint8Array, tiffBinary: string): Blob {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let ihdrInserted = false;
  let inserted = false;

  while (offset + 12 <= bytes.length) {
    const len = view.getUint32(offset);
    const type = readAscii(bytes, offset + 4, 4);
    if (offset + 12 + len > bytes.length) break;
    const chunkEnd = offset + 12 + len;

    if (type === "eXIf") {
      offset = chunkEnd;
      continue;
    }

    if (!inserted && ihdrInserted && (type === "IDAT" || type === "IEND")) {
      out.push(buildEXIfChunk(tiffBinary));
      inserted = true;
    }

    out.push(bytes.subarray(offset, chunkEnd));
    if (type === "IHDR") ihdrInserted = true;
    offset = chunkEnd;
  }

  if (!inserted) {
    out.splice(1, 0, buildEXIfChunk(tiffBinary));
  }

  const totalLen = out.reduce((s, c) => s + c.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of out) {
    result.set(c, pos);
    pos += c.byteLength;
  }
  return new Blob([result as BlobPart], { type: "image/png" });
}

function buildEXIfChunk(tiffBinary: string): Uint8Array {
  const dataLen = tiffBinary.length;
  const chunk = new Uint8Array(12 + dataLen);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, dataLen);
  chunk[4] = 0x65; // 'e'
  chunk[5] = 0x58; // 'X'
  chunk[6] = 0x49; // 'I'
  chunk[7] = 0x66; // 'f'
  for (let i = 0; i < dataLen; i++) {
    chunk[8 + i] = tiffBinary.charCodeAt(i) & 0xff;
  }
  const crc = crc32(chunk.subarray(4, 8 + dataLen));
  dv.setUint32(8 + dataLen, crc);
  return chunk;
}

function applyEdits(exif: ExifObject, edits: EditableFields): void {
  const ImageIFD = piexif.ImageIFD;
  const ExifIFD = piexif.ExifIFD;
  const GPSIFD = piexif.GPSIFD;
  const zero = exif["0th"] ?? (exif["0th"] = {});
  const exifIfd = exif.Exif ?? (exif.Exif = {});

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

  const lat = parseFloat(edits.gpsLatitude);
  const lon = parseFloat(edits.gpsLongitude);
  const hasLat = edits.gpsLatitude.trim() !== "" && Number.isFinite(lat);
  const hasLon = edits.gpsLongitude.trim() !== "" && Number.isFinite(lon);
  if (!hasLat && !hasLon) {
    exif.GPS = {};
  } else if (hasLat && hasLon) {
    const gps: Record<number, unknown> = {};
    gps[GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
    gps[GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat));
    gps[GPSIFD.GPSLongitudeRef] = lon >= 0 ? "E" : "W";
    gps[GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lon));
    exif.GPS = gps;
  }
}

function dumpTiffPayload(exif: ExifObject): string {
  const app1 = piexif.dump(exif);
  const idx = app1.indexOf(EXIF_HEADER);
  if (idx < 0) return "";
  return app1.slice(idx + EXIF_HEADER.length);
}

function setOrDelete(
  ifd: Record<number, unknown>,
  tag: number,
  value: string,
): void {
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

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) s += String.fromCharCode(bytes[offset + i]);
  return s;
}

function bytesToBinary(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return binary;
}

let _crcTable: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (_crcTable) return _crcTable;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  _crcTable = table;
  return table;
}

function crc32(bytes: Uint8Array): number {
  const table = crcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
