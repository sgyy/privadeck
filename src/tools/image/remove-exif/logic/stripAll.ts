export interface ExifResult {
  original: File;
  cleaned: Blob;
  outputFilename: string;
}

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

export function outputFilenameFor(file: File): string {
  const ext =
    SUPPORTED_EXTENSIONS[file.type] || file.name.replace(/^.*(\.[^.]+)$/, "$1");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return baseName + ext;
}

export function readAscii(
  bytes: Uint8Array,
  offset: number,
  length: number,
): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += String.fromCharCode(bytes[offset + i]);
  }
  return s;
}

// --- JPEG binary stripping ---

function stripJpegMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  if (view.getUint16(0) !== 0xffd8) return buffer;

  const segments: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;
  let foundMetadata = false;

  while (offset + 1 < buffer.byteLength) {
    const marker = view.getUint16(offset);

    if (marker === 0xffda) {
      segments.push(bytes.slice(offset));
      break;
    }

    if ((marker & 0xff00) !== 0xff00) break;

    if (
      marker === 0xff01 ||
      (marker >= 0xffd0 && marker <= 0xffd7) ||
      marker === 0xffd8 ||
      marker === 0xffd9
    ) {
      segments.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > buffer.byteLength) break;
    const segmentLength = view.getUint16(offset + 2);
    if (segmentLength < 2) break;
    const totalSize = 2 + segmentLength;
    if (offset + totalSize > buffer.byteLength) break;

    if (marker === 0xffe2 && segmentLength >= 14) {
      const magic = readAscii(bytes, offset + 4, 11);
      if (magic === "ICC_PROFILE") {
        segments.push(bytes.slice(offset, offset + totalSize));
        offset += totalSize;
        continue;
      }
    }

    if ((marker >= 0xffe1 && marker <= 0xffef) || marker === 0xfffe) {
      foundMetadata = true;
    } else {
      segments.push(bytes.slice(offset, offset + totalSize));
    }

    offset += totalSize;
  }

  if (!foundMetadata) return buffer;

  const totalLength = segments.reduce((sum, s) => sum + s.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const seg of segments) {
    result.set(seg, pos);
    pos += seg.byteLength;
  }
  return result.buffer;
}

// --- PNG binary stripping ---

const PNG_METADATA_CHUNKS = new Set([
  "tEXt",
  "zTXt",
  "iTXt",
  "eXIf",
  "tIME",
  "iCCP",
  "dSIG",
]);

function stripPngMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) return buffer;
  }

  const chunks: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;
  let foundMetadata = false;

  while (offset + 12 <= buffer.byteLength) {
    const dataLength = view.getUint32(offset);
    if (offset + 12 + dataLength > buffer.byteLength) break;
    const chunkType = readAscii(bytes, offset + 4, 4);
    const totalSize = 12 + dataLength;

    if (PNG_METADATA_CHUNKS.has(chunkType)) {
      foundMetadata = true;
    } else {
      chunks.push(bytes.slice(offset, offset + totalSize));
    }

    offset += totalSize;
  }

  if (!foundMetadata) return buffer;

  const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return result.buffer;
}

// --- WebP binary stripping ---

function stripWebpMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const riff = readAscii(bytes, 0, 4);
  const webp = readAscii(bytes, 8, 4);
  if (riff !== "RIFF" || webp !== "WEBP") return buffer;

  const chunks: Uint8Array[] = [];
  let offset = 12;
  let foundMetadata = false;
  let vp8xChunkIndex = -1;

  while (offset + 8 <= buffer.byteLength) {
    const fourCC = readAscii(bytes, offset, 4);
    const chunkDataSize = view.getUint32(offset + 4, true);
    const paddedSize = chunkDataSize + (chunkDataSize % 2);
    const totalSize = 8 + paddedSize;
    if (offset + totalSize > buffer.byteLength) break;

    if (fourCC === "EXIF" || fourCC === "XMP ") {
      foundMetadata = true;
    } else {
      if (fourCC === "VP8X") {
        vp8xChunkIndex = chunks.length;
      }
      chunks.push(bytes.slice(offset, offset + totalSize));
    }

    offset += totalSize;
  }

  if (!foundMetadata) return buffer;

  const chunksLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const totalLength = 12 + chunksLength;
  const result = new Uint8Array(totalLength);

  result.set(bytes.slice(0, 12), 0);

  const resultView = new DataView(result.buffer);
  resultView.setUint32(4, totalLength - 8, true);

  let pos = 12;
  for (let i = 0; i < chunks.length; i++) {
    result.set(chunks[i], pos);

    if (i === vp8xChunkIndex) {
      // Per libwebp spec: 0x08 = EXIF flag, 0x04 = XMP flag
      result[pos + 8] &= ~0x08;
      result[pos + 8] &= ~0x04;
    }

    pos += chunks[i].byteLength;
  }

  return result.buffer;
}

// --- AVIF (ISOBMFF) binary stripping ---

interface IsobmffBox {
  type: string;
  offset: number;
  dataOffset: number;
  size: number;
}

function parseIsobmffBoxes(
  view: DataView,
  bytes: Uint8Array,
  start: number,
  end: number,
): IsobmffBox[] {
  const boxes: IsobmffBox[] = [];
  let offset = start;
  while (offset + 8 <= end) {
    let size = view.getUint32(offset);
    const type = readAscii(bytes, offset + 4, 4);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      const hi = view.getUint32(offset + 8);
      const lo = view.getUint32(offset + 12);
      size = hi * 0x100000000 + lo;
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) break;
    boxes.push({ type, offset, dataOffset: offset + headerSize, size });
    offset += size;
  }
  return boxes;
}

function stripAvifMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (buffer.byteLength < 12) return buffer;
  const ftypType = readAscii(bytes, 4, 4);
  if (ftypType !== "ftyp") return buffer;

  const topBoxes = parseIsobmffBoxes(view, bytes, 0, buffer.byteLength);
  const metaBox = topBoxes.find((b) => b.type === "meta");
  if (!metaBox) return buffer;

  const metaChildStart = metaBox.dataOffset + 4;
  const metaEnd = metaBox.offset + metaBox.size;
  if (metaChildStart >= metaEnd) return buffer;

  const metaChildren = parseIsobmffBoxes(view, bytes, metaChildStart, metaEnd);
  const iinfBox = metaChildren.find((b) => b.type === "iinf");
  const ilocBox = metaChildren.find((b) => b.type === "iloc");
  if (!iinfBox || !ilocBox) return buffer;

  const metadataItemIds = new Set<number>();
  const iinfData = iinfBox.dataOffset;
  if (iinfData + 4 > metaEnd) return buffer;
  const iinfVersion = bytes[iinfData];
  const iinfCountOffset = iinfData + 4;
  if (iinfCountOffset + 2 > metaEnd) return buffer;
  const infeStart = iinfCountOffset + (iinfVersion === 0 ? 2 : 4);
  const iinfEnd = iinfBox.offset + iinfBox.size;
  const infeBoxes = parseIsobmffBoxes(view, bytes, infeStart, iinfEnd);

  for (const infe of infeBoxes) {
    if (infe.type !== "infe") continue;
    const infeData = infe.dataOffset;
    const infeVersion = bytes[infeData];
    if (infeVersion < 2) continue;

    let pos = infeData + 4;
    let itemId: number;
    if (infeVersion === 2) {
      if (pos + 2 > iinfEnd) continue;
      itemId = view.getUint16(pos);
      pos += 2;
    } else {
      if (pos + 4 > iinfEnd) continue;
      itemId = view.getUint32(pos);
      pos += 4;
    }
    if (pos + 6 > iinfEnd) continue;
    pos += 2;
    const itemType = readAscii(bytes, pos, 4);

    if (itemType === "Exif" || itemType === "mime") {
      metadataItemIds.add(itemId);
    }
  }

  if (metadataItemIds.size === 0) return buffer;

  const ilocData = ilocBox.dataOffset;
  const ilocEnd = ilocBox.offset + ilocBox.size;
  if (ilocData + 4 > ilocEnd) return buffer;
  const ilocVersion = bytes[ilocData];
  let pos = ilocData + 4;

  if (pos + 2 > ilocEnd) return buffer;
  const sizeBits = view.getUint16(pos);
  pos += 2;
  const offsetSize = (sizeBits >> 12) & 0xf;
  const lengthSize = (sizeBits >> 8) & 0xf;
  const baseOffsetSize = (sizeBits >> 4) & 0xf;
  const indexSize = ilocVersion >= 1 ? sizeBits & 0xf : 0;

  let itemCount: number;
  if (ilocVersion < 2) {
    if (pos + 2 > ilocEnd) return buffer;
    itemCount = view.getUint16(pos);
    pos += 2;
  } else {
    if (pos + 4 > ilocEnd) return buffer;
    itemCount = view.getUint32(pos);
    pos += 4;
  }

  function readNBytes(p: number, n: number): [number, number] {
    if (n === 0) return [0, p];
    if (p + n > buffer.byteLength) return [-1, p];
    if (n === 1) return [bytes[p], p + 1];
    if (n === 2) return [view.getUint16(p), p + 2];
    if (n === 4) return [view.getUint32(p), p + 4];
    return [0, p + n];
  }

  let result: Uint8Array | null = null;
  let foundMetadata = false;

  for (let i = 0; i < itemCount; i++) {
    let itemId: number;
    if (ilocVersion < 2) {
      if (pos + 2 > ilocEnd) break;
      itemId = view.getUint16(pos);
      pos += 2;
    } else {
      if (pos + 4 > ilocEnd) break;
      itemId = view.getUint32(pos);
      pos += 4;
    }

    let constructionMethod = 0;
    if (ilocVersion >= 1) {
      if (pos + 2 > ilocEnd) break;
      constructionMethod = view.getUint16(pos) & 0xf;
      pos += 2;
    }

    if (pos + 2 > ilocEnd) break;
    pos += 2;

    let baseOffset: number;
    [baseOffset, pos] = readNBytes(pos, baseOffsetSize);
    if (baseOffset < 0) break;

    if (pos + 2 > ilocEnd) break;
    const extentCount = view.getUint16(pos);
    pos += 2;

    const isTarget = metadataItemIds.has(itemId);

    let extentBroken = false;
    for (let e = 0; e < extentCount; e++) {
      if (ilocVersion >= 1 && indexSize > 0) {
        let idx: number;
        [idx, pos] = readNBytes(pos, indexSize);
        if (idx < 0) {
          extentBroken = true;
          break;
        }
      }
      let extOffset: number;
      let extLength: number;
      [extOffset, pos] = readNBytes(pos, offsetSize);
      if (extOffset < 0) {
        extentBroken = true;
        break;
      }
      [extLength, pos] = readNBytes(pos, lengthSize);
      if (extLength < 0) {
        extentBroken = true;
        break;
      }

      if (isTarget && constructionMethod === 0 && extLength > 0) {
        const dataStart = baseOffset + extOffset;
        const dataEnd = dataStart + extLength;
        if (dataEnd <= buffer.byteLength) {
          if (!result) {
            result = new Uint8Array(buffer.byteLength);
            result.set(bytes);
          }
          result.fill(0, dataStart, dataEnd);
          foundMetadata = true;
        }
      }
    }
    if (extentBroken) break;
  }

  if (!foundMetadata) return buffer;
  return result!.buffer as ArrayBuffer;
}

// --- Main entry ---

export async function stripAll(file: File): Promise<ExifResult> {
  const buffer = await file.arrayBuffer();

  let cleaned: ArrayBuffer;
  switch (file.type) {
    case "image/jpeg":
      cleaned = stripJpegMetadata(buffer);
      break;
    case "image/png":
      cleaned = stripPngMetadata(buffer);
      break;
    case "image/webp":
      cleaned = stripWebpMetadata(buffer);
      break;
    case "image/avif":
      cleaned = stripAvifMetadata(buffer);
      break;
    default:
      cleaned = buffer;
  }

  const outputFilename = outputFilenameFor(file);
  const blob =
    cleaned === buffer
      ? file
      : new Blob([cleaned], { type: file.type || "application/octet-stream" });

  return {
    original: file,
    cleaned: blob,
    outputFilename,
  };
}
