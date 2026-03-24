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

// --- JPEG binary stripping ---

function stripJpegMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Verify SOI marker
  if (view.getUint16(0) !== 0xffd8) return buffer;

  const segments: Uint8Array[] = [bytes.slice(0, 2)]; // Keep SOI
  let offset = 2;
  let foundMetadata = false;

  while (offset + 1 < buffer.byteLength) {
    const marker = view.getUint16(offset);

    // SOS (Start of Scan) — everything after is image data, keep it all
    if (marker === 0xffda) {
      segments.push(bytes.slice(offset));
      break;
    }

    // Not a valid marker
    if ((marker & 0xff00) !== 0xff00) break;

    // Markers without length (standalone markers like RST0-RST7)
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

    // Need at least 4 bytes for marker + length
    if (offset + 4 > buffer.byteLength) break;
    const segmentLength = view.getUint16(offset + 2);
    if (segmentLength < 2) break; // malformed: length must be >= 2
    const totalSize = 2 + segmentLength; // marker(2) + length field includes itself
    if (offset + totalSize > buffer.byteLength) break; // truncated segment

    // Remove APP1-APP15 (0xFFE1-0xFFEF) and COM (0xFFFE), but keep ICC Profile (APP2)
    if (marker === 0xffe2 && segmentLength >= 14) {
      // APP2: check if it's an ICC profile — preserve it
      const magic = readAscii(bytes, offset + 4, 11);
      if (magic === "ICC_PROFILE") {
        segments.push(bytes.slice(offset, offset + totalSize));
        offset += totalSize;
        continue;
      }
    }

    if (
      (marker >= 0xffe1 && marker <= 0xffef) ||
      marker === 0xfffe
    ) {
      foundMetadata = true;
    } else {
      segments.push(bytes.slice(offset, offset + totalSize));
    }

    offset += totalSize;
  }

  if (!foundMetadata) return buffer;

  // Concatenate kept segments
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

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += String.fromCharCode(bytes[offset + i]);
  }
  return s;
}

function stripPngMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Verify PNG signature
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) return buffer;
  }

  const chunks: Uint8Array[] = [bytes.slice(0, 8)]; // Keep signature
  let offset = 8;
  let foundMetadata = false;

  while (offset + 12 <= buffer.byteLength) {
    const dataLength = view.getUint32(offset);
    if (offset + 12 + dataLength > buffer.byteLength) break; // truncated chunk
    const chunkType = readAscii(bytes, offset + 4, 4);
    const totalSize = 12 + dataLength; // length(4) + type(4) + data + CRC(4)

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

  // Verify RIFF...WEBP header
  const riff = readAscii(bytes, 0, 4);
  const webp = readAscii(bytes, 8, 4);
  if (riff !== "RIFF" || webp !== "WEBP") return buffer;

  const chunks: Uint8Array[] = [];
  let offset = 12; // Past "RIFF" + size(4) + "WEBP"
  let foundMetadata = false;
  let vp8xChunkIndex = -1;

  while (offset + 8 <= buffer.byteLength) {
    const fourCC = readAscii(bytes, offset, 4);
    const chunkDataSize = view.getUint32(offset + 4, true); // little-endian
    const paddedSize = chunkDataSize + (chunkDataSize % 2); // pad to even
    const totalSize = 8 + paddedSize; // fourCC(4) + size(4) + data (padded)
    if (offset + totalSize > buffer.byteLength) break; // truncated chunk

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

  // Rebuild: RIFF header (12 bytes) + kept chunks
  const chunksLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const totalLength = 12 + chunksLength;
  const result = new Uint8Array(totalLength);

  // Copy RIFF header
  result.set(bytes.slice(0, 12), 0);

  // Update RIFF size (total file size - 8)
  const resultView = new DataView(result.buffer);
  resultView.setUint32(4, totalLength - 8, true);

  // Copy chunks
  let pos = 12;
  for (let i = 0; i < chunks.length; i++) {
    result.set(chunks[i], pos);

    // Clear EXIF and XMP flags in VP8X chunk
    if (i === vp8xChunkIndex) {
      // VP8X flags are at data offset 0 (chunk offset + 8)
      // Bit 2 (0x04) = XMP, Bit 1 (0x02) = EXIF
      result[pos + 8] &= ~0x02; // Clear EXIF flag
      result[pos + 8] &= ~0x04; // Clear XMP flag
    }

    pos += chunks[i].byteLength;
  }

  return result.buffer;
}

// --- AVIF (ISOBMFF) binary stripping ---
// AVIF uses ISO Base Media File Format (like MP4). Metadata is stored as items
// inside the `meta` box. We locate Exif/XMP items via `iinf` → `iloc`, then
// zero-fill their data in-place so no box sizes or offsets change.

interface IsobmffBox {
  type: string;
  offset: number; // start of box (including header)
  dataOffset: number; // start of box payload
  size: number; // total box size
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
      // 64-bit extended size
      if (offset + 16 > end) break;
      // Read as two 32-bit values (JS doesn't have native uint64)
      const hi = view.getUint32(offset + 8);
      const lo = view.getUint32(offset + 12);
      size = hi * 0x100000000 + lo;
      headerSize = 16;
    } else if (size === 0) {
      // Box extends to end of container
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

  // Verify ftyp box exists at start
  if (buffer.byteLength < 12) return buffer;
  const ftypType = readAscii(bytes, 4, 4);
  if (ftypType !== "ftyp") return buffer;

  // Parse top-level boxes to find `meta`
  const topBoxes = parseIsobmffBoxes(view, bytes, 0, buffer.byteLength);
  const metaBox = topBoxes.find((b) => b.type === "meta");
  if (!metaBox) return buffer;

  // `meta` is a FullBox: 4 bytes version+flags before children
  const metaChildStart = metaBox.dataOffset + 4;
  const metaEnd = metaBox.offset + metaBox.size;
  if (metaChildStart >= metaEnd) return buffer;

  const metaChildren = parseIsobmffBoxes(view, bytes, metaChildStart, metaEnd);
  const iinfBox = metaChildren.find((b) => b.type === "iinf");
  const ilocBox = metaChildren.find((b) => b.type === "iloc");
  if (!iinfBox || !ilocBox) return buffer;

  // Parse iinf to find Exif and XMP item IDs
  const metadataItemIds = new Set<number>();
  const iinfData = iinfBox.dataOffset;
  if (iinfData + 4 > metaEnd) return buffer;
  const iinfVersion = bytes[iinfData];
  const iinfCountOffset = iinfData + 4;
  if (iinfCountOffset + 2 > metaEnd) return buffer;
  // entry_count is 4 bytes for version 0 in some specs, but commonly 2 bytes
  // Parse child `infe` boxes instead for robustness
  const infeStart = iinfCountOffset + (iinfVersion === 0 ? 2 : 4);
  const iinfEnd = iinfBox.offset + iinfBox.size;
  const infeBoxes = parseIsobmffBoxes(view, bytes, infeStart, iinfEnd);

  for (const infe of infeBoxes) {
    if (infe.type !== "infe") continue;
    const infeData = infe.dataOffset;
    const infeVersion = bytes[infeData];
    if (infeVersion < 2) continue; // version 0/1 don't have item_type FourCC

    // FullBox: 4 bytes version+flags
    let pos = infeData + 4;
    // item_ID: 2 bytes (v2) or 4 bytes (v3)
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
    // item_protection_index: 2 bytes + item_type: 4 bytes FourCC
    if (pos + 6 > iinfEnd) continue;
    pos += 2;
    const itemType = readAscii(bytes, pos, 4);

    if (itemType === "Exif" || itemType === "mime") {
      metadataItemIds.add(itemId);
    }
  }

  if (metadataItemIds.size === 0) return buffer;

  // Parse iloc to find data locations for metadata items
  const ilocData = ilocBox.dataOffset;
  const ilocEnd = ilocBox.offset + ilocBox.size;
  if (ilocData + 4 > ilocEnd) return buffer;
  const ilocVersion = bytes[ilocData];
  let pos = ilocData + 4; // past version+flags

  if (pos + 2 > ilocEnd) return buffer;
  const sizeBits = view.getUint16(pos);
  pos += 2;
  const offsetSize = (sizeBits >> 12) & 0xf;
  const lengthSize = (sizeBits >> 8) & 0xf;
  const baseOffsetSize = (sizeBits >> 4) & 0xf;
  const indexSize = ilocVersion >= 1 ? sizeBits & 0xf : 0;

  // item_count
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

  // Helper to read N-byte unsigned int (0, 1, 2, 4 bytes)
  // Returns [-1, p] if out of bounds
  function readNBytes(p: number, n: number): [number, number] {
    if (n === 0) return [0, p];
    if (p + n > buffer.byteLength) return [-1, p];
    if (n === 1) return [bytes[p], p + 1];
    if (n === 2) return [view.getUint16(p), p + 2];
    if (n === 4) return [view.getUint32(p), p + 4];
    return [0, p + n]; // unsupported size, skip
  }

  // Make a mutable copy only when we need to zero-fill
  let result: Uint8Array | null = null;
  let foundMetadata = false;

  for (let i = 0; i < itemCount; i++) {
    // item_ID
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

    // construction_method (version >= 1): 2 bytes
    let constructionMethod = 0;
    if (ilocVersion >= 1) {
      if (pos + 2 > ilocEnd) break;
      constructionMethod = view.getUint16(pos) & 0xf;
      pos += 2;
    }

    // data_reference_index: 2 bytes
    if (pos + 2 > ilocEnd) break;
    pos += 2;

    // base_offset
    let baseOffset: number;
    [baseOffset, pos] = readNBytes(pos, baseOffsetSize);
    if (baseOffset < 0) break;

    // extent_count: 2 bytes
    if (pos + 2 > ilocEnd) break;
    const extentCount = view.getUint16(pos);
    pos += 2;

    const isTarget = metadataItemIds.has(itemId);

    let extentBroken = false;
    for (let e = 0; e < extentCount; e++) {
      // extent_index (version >= 1 and indexSize > 0)
      if (ilocVersion >= 1 && indexSize > 0) {
        let idx: number;
        [idx, pos] = readNBytes(pos, indexSize);
        if (idx < 0) { extentBroken = true; break; }
      }
      let extOffset: number;
      let extLength: number;
      [extOffset, pos] = readNBytes(pos, offsetSize);
      if (extOffset < 0) { extentBroken = true; break; }
      [extLength, pos] = readNBytes(pos, lengthSize);
      if (extLength < 0) { extentBroken = true; break; }

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

export async function removeExif(file: File): Promise<ExifResult> {
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
      // Unsupported format — return original unchanged
      cleaned = buffer;
  }

  const ext = SUPPORTED_EXTENSIONS[file.type] || file.name.replace(/^.*(\.[^.]+)$/, "$1");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const outputFilename = baseName + ext;

  // If no metadata was found, cleaned === buffer (same reference)
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

