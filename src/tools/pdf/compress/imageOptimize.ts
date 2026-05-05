import { PDFDocument, PDFRawStream, PDFName, PDFArray, PDFNumber } from "pdf-lib";
import type {
  CompressOptions,
  CompressReportItem,
  CompressResult,
  ProgressCallback,
} from "./types";
import { applyCleanup, buildOriginalWithCleanup, FALLBACK_THRESHOLD } from "./cleanup";

const QUALITY_MAP: Record<"high" | "medium" | "low", { scale: number; jpegQuality: number }> = {
  high: { scale: 1.0, jpegQuality: 0.85 },
  medium: { scale: 0.75, jpegQuality: 0.65 },
  low: { scale: 0.5, jpegQuality: 0.45 },
};

const MIN_OPTIMIZED_DIMENSION = 64;

interface ImageConfig {
  scale: number;
  jpegQuality: number;
}

function resolveConfig(options: CompressOptions): ImageConfig {
  if (options.quality === "custom") {
    const dpi = options.customDpi ?? 96;
    const scale = Math.min(1.0, dpi / 150);
    const jpegQuality = (options.customJpegQuality ?? 65) / 100;
    return { scale, jpegQuality };
  }
  return QUALITY_MAP[options.quality];
}

function isJpegFilter(filter: unknown): boolean {
  if (filter instanceof PDFName) {
    return filter.toString() === "/DCTDecode";
  }
  if (filter instanceof PDFArray && filter.size() === 1) {
    const first = filter.get(0);
    return first instanceof PDFName && first.toString() === "/DCTDecode";
  }
  return false;
}

type ColorSpaceKind = "DeviceRGB" | "DeviceGray" | "ICCBased" | null;

function classifyColorSpace(colorSpace: unknown): ColorSpaceKind {
  if (colorSpace instanceof PDFName) {
    if (colorSpace.toString() === "/DeviceRGB") return "DeviceRGB";
    if (colorSpace.toString() === "/DeviceGray") return "DeviceGray";
    return null;
  }
  if (colorSpace instanceof PDFArray && colorSpace.size() >= 2) {
    const first = colorSpace.get(0);
    if (first instanceof PDFName && first.toString() === "/ICCBased") {
      // canvas decoding ignores embedded ICC profile from PDF dictionary;
      // output will be sRGB. Slight color shift is acceptable for compression.
      return "ICCBased";
    }
  }
  return null;
}

async function decodeJpeg(bytes: Uint8Array): Promise<HTMLImageElement> {
  const blob = new Blob([bytes as BlobPart], { type: "image/jpeg" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("JPEG decode failed"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function recompressJpeg(
  bytes: Uint8Array,
  targetWidth: number,
  targetHeight: number,
  jpegQuality: number,
): Promise<Uint8Array> {
  const img = await decodeJpeg(bytes);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  try {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("JPEG re-encode failed"))),
        "image/jpeg",
        jpegQuality,
      );
    });
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

interface ImageCandidate {
  ref: import("pdf-lib").PDFRef;
  stream: PDFRawStream;
  width: number;
  height: number;
  outputColorSpace: "DeviceRGB" | "DeviceGray";
}

function collectImageCandidates(doc: PDFDocument): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;

    try {
      const subtype = dict.lookup(PDFName.of("Subtype"));
      if (!(subtype instanceof PDFName) || subtype.toString() !== "/Image") continue;

      const filter = dict.lookup(PDFName.of("Filter"));
      if (!isJpegFilter(filter)) continue;

      if (dict.has(PDFName.of("SMask"))) continue;
      if (dict.has(PDFName.of("ImageMask"))) continue;

      const colorSpaceKind = classifyColorSpace(dict.lookup(PDFName.of("ColorSpace")));
      if (colorSpaceKind === null) continue;
      const outputColorSpace = colorSpaceKind === "DeviceGray" ? "DeviceGray" : "DeviceRGB";

      const widthObj = dict.lookupMaybe(PDFName.of("Width"), PDFNumber);
      const heightObj = dict.lookupMaybe(PDFName.of("Height"), PDFNumber);
      const width = widthObj?.asNumber();
      const height = heightObj?.asNumber();
      if (typeof width !== "number" || typeof height !== "number") continue;
      if (width < MIN_OPTIMIZED_DIMENSION || height < MIN_OPTIMIZED_DIMENSION) continue;

      candidates.push({ ref, stream: obj, width, height, outputColorSpace });
    } catch (err) {
      // Skip malformed image dicts (e.g. Width/Height with unexpected type)
      console.warn(`Image candidate skipped for ref ${ref.toString()}:`, err);
    }
  }
  return candidates;
}

export async function imageOptimize(
  file: File,
  options: CompressOptions,
  onProgress?: ProgressCallback,
): Promise<CompressResult | null> {
  const config = resolveConfig(options);
  const bytes = new Uint8Array(await file.arrayBuffer());
  // ignoreEncryption: true unlocks permission-only encrypted PDFs (e.g., "no
  // copy/print" flags). Open-password PDFs are already caught upstream by
  // getPdfPreview's PasswordException → PdfEncryptedError, so they never
  // reach this code path.
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const candidates = collectImageCandidates(doc);

  if (candidates.length === 0) {
    return null;
  }

  const reportItems: CompressReportItem[] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (options.signal?.aborted) {
      throw new DOMException("Compression aborted", "AbortError");
    }
    const cand = candidates[i];
    const targetWidth = Math.max(MIN_OPTIMIZED_DIMENSION, Math.round(cand.width * config.scale));
    const targetHeight = Math.max(MIN_OPTIMIZED_DIMENSION, Math.round(cand.height * config.scale));

    try {
      const newBytes = await recompressJpeg(
        cand.stream.contents,
        targetWidth,
        targetHeight,
        config.jpegQuality,
      );

      if (newBytes.length >= cand.stream.contents.length) {
        // Skipped: re-encoded JPEG would be larger than the original stream.
        // Don't include in the report so Top-N rankings highlight actual savings only.
        onProgress?.({ kind: "image", current: i + 1, total: candidates.length });
        continue;
      }

      const newStream = doc.context.stream(newBytes, {
        Type: "XObject",
        Subtype: "Image",
        Width: targetWidth,
        Height: targetHeight,
        ColorSpace: cand.outputColorSpace,
        BitsPerComponent: 8,
        Filter: "DCTDecode",
      });

      doc.context.assign(cand.ref, newStream);

      reportItems.push({
        index: i + 1,
        label: `image-${i + 1}`,
        beforeBytes: cand.stream.contents.length,
        afterBytes: newBytes.length,
      });
    } catch (err) {
      console.warn(`Image optimize skipped for ref ${cand.ref.toString()}:`, err);
    }

    onProgress?.({ kind: "image", current: i + 1, total: candidates.length });
  }

  applyCleanup(doc, options.cleanup);
  const pdfBytes = await doc.save();

  if (pdfBytes.length >= bytes.length * FALLBACK_THRESHOLD) {
    const fallbackBytes = await buildOriginalWithCleanup(bytes, options.cleanup);
    return {
      blob: new Blob([fallbackBytes as BlobPart], { type: "application/pdf" }),
      usedOriginal: true,
      modeUsed: "image-optimize",
    };
  }

  return {
    blob: new Blob([pdfBytes as BlobPart], { type: "application/pdf" }),
    usedOriginal: false,
    modeUsed: "image-optimize",
    report: { items: reportItems },
  };
}
