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
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export async function selectivePng(
  file: File,
  opts: RemoveExifOptions,
): Promise<ExifResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!hasPngSignature(bytes)) {
    return passthrough(file);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let replacementExifChunk: Uint8Array | null = null;
  let ihdrSeenBeforeIdat = false;
  let exifInserted = false;

  while (offset + 12 <= bytes.length) {
    const len = view.getUint32(offset);
    if (offset + 12 + len > bytes.length) break;
    const type = readAscii(bytes, offset + 4, 4);
    const chunkEnd = offset + 12 + len;

    let keep = true;

    if (type === "eXIf") {
      const tiff = bytesToBinary(bytes.subarray(offset + 8, offset + 8 + len));
      const rebuilt = rebuildEXIf(tiff, opts);
      if (rebuilt) {
        replacementExifChunk = rebuilt;
      }
      keep = false;
    } else if (type === "tEXt") {
      keep = shouldKeepTextChunk(
        parseKeywordLatin1(bytes, offset + 8, len),
        opts,
      );
    } else if (type === "zTXt") {
      keep = shouldKeepTextChunk(
        parseKeywordLatin1(bytes, offset + 8, len),
        opts,
      );
    } else if (type === "iTXt") {
      keep = shouldKeepTextChunk(
        parseKeywordLatin1(bytes, offset + 8, len),
        opts,
      );
    } else if (type === "tIME") {
      keep = !opts.dateTime;
    }

    if (keep) {
      if (
        replacementExifChunk &&
        !exifInserted &&
        ihdrSeenBeforeIdat &&
        (type === "IDAT" || type === "IEND")
      ) {
        out.push(replacementExifChunk);
        exifInserted = true;
      }
      out.push(bytes.subarray(offset, chunkEnd));
      if (type === "IHDR") ihdrSeenBeforeIdat = true;
    }

    offset = chunkEnd;
  }

  if (replacementExifChunk && !exifInserted) {
    out.splice(1, 0, replacementExifChunk);
  }

  const totalLen = out.reduce((s, c) => s + c.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of out) {
    result.set(c, pos);
    pos += c.byteLength;
  }

  const outputFilename = outputFilenameFor(file);
  const blob = new Blob([result as BlobPart], { type: "image/png" });
  return { original: file, cleaned: blob, outputFilename };
}

function rebuildEXIf(tiff: string, opts: RemoveExifOptions): Uint8Array | null {
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
  return buildEXIfChunk(newTiff);
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

function parseKeywordLatin1(
  bytes: Uint8Array,
  dataOffset: number,
  len: number,
): string {
  const maxKey = Math.min(len, 79);
  let keyword = "";
  for (let i = 0; i < maxKey; i++) {
    const c = bytes[dataOffset + i];
    if (c === 0) break;
    keyword += String.fromCharCode(c);
  }
  return keyword;
}

function shouldKeepTextChunk(
  keyword: string,
  opts: RemoveExifOptions,
): boolean {
  const normalized = keyword.toLowerCase();

  if (
    opts.xmp &&
    (normalized === "xml:com.adobe.xmp" || normalized.startsWith("xmp"))
  ) {
    return false;
  }
  if (opts.author && (normalized === "author" || normalized === "copyright")) {
    return false;
  }
  if (
    opts.description &&
    (normalized === "title" ||
      normalized === "description" ||
      normalized === "comment" ||
      normalized === "keywords")
  ) {
    return false;
  }
  if (opts.dateTime && normalized === "creation time") {
    return false;
  }
  return true;
}

function hasPngSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) return false;
  }
  return true;
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
