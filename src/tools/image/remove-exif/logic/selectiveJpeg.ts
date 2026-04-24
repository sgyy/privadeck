import piexif from "piexifjs";
import type { RemoveExifOptions } from "./options";
import {
  applyGroupDeletes,
  createEmptyExif,
  isExifEffectivelyEmpty,
  type ExifObject,
} from "./groupDeletes";
import { outputFilenameFor, type ExifResult } from "./stripAll";

const XMP_MAGIC = "http://ns.adobe.com/xap/1.0/\x00";
const XMP_EXT_MAGIC = "http://ns.adobe.com/xmp/extension/\x00";

export async function selectiveJpeg(
  file: File,
  opts: RemoveExifOptions,
): Promise<ExifResult> {
  const buffer = await file.arrayBuffer();
  let binary = arrayBufferToBinary(buffer);

  let exif: ExifObject;
  try {
    exif = piexif.load(binary) as ExifObject;
  } catch {
    exif = createEmptyExif();
  }

  applyGroupDeletes(exif, opts);

  if (isExifEffectivelyEmpty(exif)) {
    binary = piexif.remove(binary);
  } else {
    try {
      const exifStr = piexif.dump(exif);
      binary = piexif.insert(exifStr, binary);
    } catch {
      binary = piexif.remove(binary);
    }
  }

  if (opts.xmp) {
    binary = stripXmpApp1Segments(binary);
  }

  const outputFilename = outputFilenameFor(file);
  const cleanedBytes = binaryToUint8Array(binary);
  const blob = new Blob([cleanedBytes as BlobPart], { type: "image/jpeg" });

  return { original: file, cleaned: blob, outputFilename };
}

function stripXmpApp1Segments(binary: string): string {
  if (binary.length < 2) return binary;
  if (binary.charCodeAt(0) !== 0xff || binary.charCodeAt(1) !== 0xd8) {
    return binary;
  }

  const parts: string[] = [binary.slice(0, 2)];
  let offset = 2;
  const len = binary.length;

  while (offset + 1 < len) {
    const hi = binary.charCodeAt(offset);
    const lo = binary.charCodeAt(offset + 1);

    if (hi !== 0xff) break;

    if (lo === 0xda) {
      parts.push(binary.slice(offset));
      return parts.join("");
    }

    if (
      lo === 0x01 ||
      (lo >= 0xd0 && lo <= 0xd7) ||
      lo === 0xd8 ||
      lo === 0xd9
    ) {
      parts.push(binary.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > len) break;
    const segLen =
      (binary.charCodeAt(offset + 2) << 8) | binary.charCodeAt(offset + 3);
    if (segLen < 2) break;
    const totalSize = 2 + segLen;
    if (offset + totalSize > len) break;

    if (lo === 0xe1) {
      const payload = binary.slice(offset + 4, offset + totalSize);
      if (
        payload.startsWith(XMP_MAGIC) ||
        payload.startsWith(XMP_EXT_MAGIC)
      ) {
        offset += totalSize;
        continue;
      }
    }

    parts.push(binary.slice(offset, offset + totalSize));
    offset += totalSize;
  }

  parts.push(binary.slice(offset));
  return parts.join("");
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

function binaryToUint8Array(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return bytes;
}
