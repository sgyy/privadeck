import piexif from "piexifjs";
import type { EditableFields } from "../types";
import type { ExifObject } from "./writeJpegExif";

const EXIF_HEADER = "Exif\x00\x00";
const EXIF_FLAG = 0x08;
const ALPHA_FLAG = 0x10;

interface WebpChunk {
  fourCC: string;
  offset: number;
  dataOffset: number;
  dataSize: number;
  totalSize: number;
}

export async function writeWebpExif(
  file: File,
  edits: EditableFields,
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  assertRiffWebp(bytes);
  const chunks = parseChunks(bytes);
  const existingTiff = extractExistingTiff(bytes, chunks);
  const exifObj: ExifObject = existingTiff
    ? (piexif.load(EXIF_HEADER + existingTiff) as ExifObject)
    : emptyExif();
  applyEdits(exifObj, edits);
  const newTiff = dumpTiffPayload(exifObj);
  return rebuildWebp(bytes, chunks, newTiff);
}

function emptyExif(): ExifObject {
  return { "0th": {}, Exif: {}, GPS: {}, Interop: {}, "1st": {}, thumbnail: null };
}

function isRiffWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 4) === "WEBP"
  );
}

function assertRiffWebp(bytes: Uint8Array): void {
  if (!isRiffWebp(bytes)) throw new Error("Not a valid WebP file");
}

function parseChunks(bytes: Uint8Array): WebpChunk[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: WebpChunk[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const fourCC = readAscii(bytes, offset, 4);
    const dataSize = view.getUint32(offset + 4, true);
    const padded = dataSize + (dataSize % 2);
    const totalSize = 8 + padded;
    if (offset + totalSize > bytes.length) break;
    out.push({
      fourCC,
      offset,
      dataOffset: offset + 8,
      dataSize,
      totalSize,
    });
    offset += totalSize;
  }
  return out;
}

function extractExistingTiff(bytes: Uint8Array, chunks: WebpChunk[]): string | null {
  const exifChunk = chunks.find((c) => c.fourCC === "EXIF");
  if (!exifChunk) return null;
  return bytesToBinary(
    bytes.subarray(exifChunk.dataOffset, exifChunk.dataOffset + exifChunk.dataSize),
  );
}

function rebuildWebp(
  bytes: Uint8Array,
  chunks: WebpChunk[],
  tiffBinary: string,
): Blob {
  const vp8x = chunks.find((c) => c.fourCC === "VP8X");

  const newVp8xChunk: Uint8Array = vp8x
    ? cloneChunkWithExifFlag(bytes, vp8x)
    : buildVp8xFromBase(bytes, chunks);

  const exifChunkNew = buildExifChunk(tiffBinary);

  const pieces: Uint8Array[] = [];
  pieces.push(bytes.subarray(0, 4)); // "RIFF"
  pieces.push(new Uint8Array(4)); // placeholder for file size
  pieces.push(bytes.subarray(8, 12)); // "WEBP"

  pieces.push(newVp8xChunk);

  for (const c of chunks) {
    if (c.fourCC === "VP8X") continue;
    if (c.fourCC === "EXIF") continue;
    pieces.push(bytes.subarray(c.offset, c.offset + c.totalSize));
  }

  pieces.push(exifChunkNew);

  const totalLen = pieces.reduce((s, p) => s + p.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of pieces) {
    result.set(p, pos);
    pos += p.byteLength;
  }

  // Update RIFF size (file size - 8)
  const resultView = new DataView(result.buffer);
  resultView.setUint32(4, totalLen - 8, true);

  return new Blob([result as BlobPart], { type: "image/webp" });
}

function cloneChunkWithExifFlag(bytes: Uint8Array, vp8x: WebpChunk): Uint8Array {
  const cloned = bytes.slice(vp8x.offset, vp8x.offset + vp8x.totalSize);
  // flags byte is at dataOffset (first byte of payload)
  const flagsIndex = 8;
  cloned[flagsIndex] = cloned[flagsIndex] | EXIF_FLAG;
  return cloned;
}

function buildVp8xFromBase(bytes: Uint8Array, chunks: WebpChunk[]): Uint8Array {
  const info = extractDimensions(bytes, chunks);
  if (!info) throw new Error("Unable to determine WebP dimensions");
  const hasAlph = chunks.some((c) => c.fourCC === "ALPH");
  let flags = EXIF_FLAG;
  if (info.hasAlpha || hasAlph) flags |= ALPHA_FLAG;
  const chunk = new Uint8Array(8 + 10);
  const dv = new DataView(chunk.buffer);
  chunk[0] = 0x56; // V
  chunk[1] = 0x50; // P
  chunk[2] = 0x38; // 8
  chunk[3] = 0x58; // X
  dv.setUint32(4, 10, true); // size
  chunk[8] = flags;
  chunk[9] = 0;
  chunk[10] = 0;
  chunk[11] = 0;
  writeUint24LE(chunk, 12, info.width - 1);
  writeUint24LE(chunk, 15, info.height - 1);
  return chunk;
}

function buildExifChunk(tiffBinary: string): Uint8Array {
  const dataLen = tiffBinary.length;
  const padded = dataLen + (dataLen % 2);
  const chunk = new Uint8Array(8 + padded);
  const dv = new DataView(chunk.buffer);
  chunk[0] = 0x45; // E
  chunk[1] = 0x58; // X
  chunk[2] = 0x49; // I
  chunk[3] = 0x46; // F
  dv.setUint32(4, dataLen, true);
  for (let i = 0; i < dataLen; i++) {
    chunk[8 + i] = tiffBinary.charCodeAt(i) & 0xff;
  }
  // padding byte already zero
  return chunk;
}

interface WebpDimensions {
  width: number;
  height: number;
  hasAlpha: boolean;
}

function extractDimensions(
  bytes: Uint8Array,
  chunks: WebpChunk[],
): WebpDimensions | null {
  const vp8 = chunks.find((c) => c.fourCC === "VP8 ");
  if (vp8) {
    const d = vp8.dataOffset;
    if (d + 10 > bytes.length) return null;
    if (bytes[d + 3] !== 0x9d || bytes[d + 4] !== 0x01 || bytes[d + 5] !== 0x2a) {
      return null;
    }
    const w = (bytes[d + 6] | (bytes[d + 7] << 8)) & 0x3fff;
    const h = (bytes[d + 8] | (bytes[d + 9] << 8)) & 0x3fff;
    return { width: w, height: h, hasAlpha: false };
  }
  const vp8l = chunks.find((c) => c.fourCC === "VP8L");
  if (vp8l) {
    const d = vp8l.dataOffset;
    if (d + 5 > bytes.length) return null;
    if (bytes[d] !== 0x2f) return null;
    const b1 = bytes[d + 1];
    const b2 = bytes[d + 2];
    const b3 = bytes[d + 3];
    const b4 = bytes[d + 4];
    const width = 1 + (b1 | ((b2 & 0x3f) << 8));
    const height = 1 + (((b2 >> 6) & 0x03) | (b3 << 2) | ((b4 & 0x0f) << 10));
    const hasAlpha = ((b4 >> 4) & 0x01) === 1;
    return { width, height, hasAlpha };
  }
  const anim = chunks.find((c) => c.fourCC === "ANIM");
  if (anim) {
    const anmf = chunks.find((c) => c.fourCC === "ANMF");
    if (anmf && anmf.dataOffset + 9 <= bytes.length) {
      const w = readUint24LE(bytes, anmf.dataOffset + 6) + 1;
      const h = readUint24LE(bytes, anmf.dataOffset + 9) + 1;
      return { width: w, height: h, hasAlpha: false };
    }
  }
  return null;
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

function writeUint24LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}
