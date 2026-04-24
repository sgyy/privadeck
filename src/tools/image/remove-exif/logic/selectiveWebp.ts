import piexif from "piexifjs";
import type { RemoveExifOptions } from "./options";
import {
  applyGroupDeletes,
  createEmptyExif,
  isExifEffectivelyEmpty,
  type ExifObject,
} from "./groupDeletes";
import { outputFilenameFor, readAscii, type ExifResult } from "./stripAll";

const EXIF_HEADER = "Exif\x00\x00";
// VP8X flag bits per WebP container spec (libwebp):
// 0x20 = ICC profile, 0x10 = Alpha, 0x08 = EXIF, 0x04 = XMP, 0x02 = Animation
const VP8X_EXIF_FLAG = 0x08;
const VP8X_XMP_FLAG = 0x04;

interface WebpChunk {
  fourCC: string;
  offset: number;
  dataOffset: number;
  dataSize: number;
  totalSize: number;
}

export async function selectiveWebp(
  file: File,
  opts: RemoveExifOptions,
): Promise<ExifResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!isRiffWebp(bytes)) {
    return passthrough(file);
  }

  const chunks = parseChunks(bytes);
  const exifChunk = chunks.find((c) => c.fourCC === "EXIF");
  const xmpChunk = chunks.find((c) => c.fourCC === "XMP ");
  const vp8xChunk = chunks.find((c) => c.fourCC === "VP8X");

  let newExifChunk: Uint8Array | null = null;
  let exifRemoved = false;

  if (exifChunk) {
    const tiff = bytesToBinary(
      bytes.subarray(exifChunk.dataOffset, exifChunk.dataOffset + exifChunk.dataSize),
    );
    const rebuilt = rebuildEXIFChunk(tiff, opts);
    if (rebuilt) {
      newExifChunk = rebuilt;
    } else {
      exifRemoved = true;
    }
  }

  const xmpRemoved = Boolean(xmpChunk) && opts.xmp;

  const pieces: Uint8Array[] = [];
  pieces.push(bytes.subarray(0, 4)); // "RIFF"
  pieces.push(new Uint8Array(4)); // placeholder for file size
  pieces.push(bytes.subarray(8, 12)); // "WEBP"

  if (vp8xChunk) {
    pieces.push(updateVp8xFlags(bytes, vp8xChunk, exifRemoved, xmpRemoved));
  }

  for (const c of chunks) {
    if (c.fourCC === "VP8X") continue;
    if (c.fourCC === "EXIF") {
      if (newExifChunk) {
        pieces.push(newExifChunk);
      }
      continue;
    }
    if (c.fourCC === "XMP " && opts.xmp) continue;
    pieces.push(bytes.subarray(c.offset, c.offset + c.totalSize));
  }

  if (!exifChunk && newExifChunk) {
    pieces.push(newExifChunk);
  }

  const totalLen = pieces.reduce((s, p) => s + p.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of pieces) {
    result.set(p, pos);
    pos += p.byteLength;
  }

  const resultView = new DataView(result.buffer);
  resultView.setUint32(4, totalLen - 8, true);

  const outputFilename = outputFilenameFor(file);
  const blob = new Blob([result as BlobPart], { type: "image/webp" });
  return { original: file, cleaned: blob, outputFilename };
}

function updateVp8xFlags(
  bytes: Uint8Array,
  vp8x: WebpChunk,
  exifRemoved: boolean,
  xmpRemoved: boolean,
): Uint8Array {
  const cloned = bytes.slice(vp8x.offset, vp8x.offset + vp8x.totalSize);
  const flagsIndex = 8;
  if (exifRemoved) cloned[flagsIndex] &= ~VP8X_EXIF_FLAG;
  if (xmpRemoved) cloned[flagsIndex] &= ~VP8X_XMP_FLAG;
  return cloned;
}

function rebuildEXIFChunk(
  tiff: string,
  opts: RemoveExifOptions,
): Uint8Array | null {
  let exif: ExifObject;
  try {
    exif = piexif.load(EXIF_HEADER + tiff) as ExifObject;
  } catch {
    exif = createEmptyExif();
  }
  applyGroupDeletes(exif, opts);
  if (isExifEffectivelyEmpty(exif)) return null;
  let newTiff: string;
  try {
    const app1 = piexif.dump(exif);
    const idx = app1.indexOf(EXIF_HEADER);
    if (idx < 0) return null;
    newTiff = app1.slice(idx + EXIF_HEADER.length);
  } catch {
    return null;
  }
  return buildEXIFChunk(newTiff);
}

function buildEXIFChunk(tiffBinary: string): Uint8Array {
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
  return chunk;
}

function isRiffWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 4) === "WEBP"
  );
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

function bytesToBinary(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return binary;
}

async function passthrough(file: File): Promise<ExifResult> {
  return {
    original: file,
    cleaned: file,
    outputFilename: outputFilenameFor(file),
  };
}
