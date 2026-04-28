import { PDFDocument } from "pdf-lib";
import { zipSync } from "fflate";
import { getPdfjs } from "@/lib/pdfjs";

export type SplitMode =
  | "each"
  | "every"
  | "oddEven"
  | "half"
  | "range"
  | "size"
  | "outline";

export interface SplitResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  pageIndices: number[];
  label?: string;
  oversized?: boolean;
}

export interface SplitProgress {
  current: number;
  total: number;
  phase?: "splitting" | "probing" | "zipping";
}

export type ProgressCb = (p: SplitProgress) => void;

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

async function loadPdfDoc(file: File): Promise<PDFDocument> {
  const buf = await file.arrayBuffer();
  return PDFDocument.load(buf);
}

async function buildPdfFromIndices(
  src: PDFDocument,
  indices0: number[],
): Promise<Uint8Array> {
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(src, indices0);
  for (const p of pages) newPdf.addPage(p);
  return newPdf.save();
}

function bytesToBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

function baseName(file: File): string {
  return file.name.replace(/\.pdf$/i, "");
}

function sanitizeFilename(s: string, fallback: string): string {
  const cleaned = s
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > 100 ? cleaned.slice(0, 100) : cleaned;
}

function indicesRange0(start1: number, end1: number): number[] {
  const out: number[] = [];
  for (let i = start1 - 1; i < end1; i++) out.push(i);
  return out;
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise<void>((r) => setTimeout(r, 0));
}

export async function splitByEach(
  file: File,
  signal?: AbortSignal,
  onProgress?: ProgressCb,
  onPart?: (r: SplitResult) => void,
): Promise<SplitResult[]> {
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const base = baseName(file);
  const results: SplitResult[] = [];

  for (let i = 0; i < total; i++) {
    checkAborted(signal);
    const bytes = await buildPdfFromIndices(src, [i]);
    const r: SplitResult = {
      blob: bytesToBlob(bytes),
      filename: `${base}_page_${i + 1}.pdf`,
      pageCount: 1,
      pageIndices: [i + 1],
    };
    results.push(r);
    onPart?.(r);
    onProgress?.({ current: i + 1, total, phase: "splitting" });
    if ((i + 1) % 50 === 0) await yieldToEventLoop();
  }
  return results;
}

export async function splitByEvery(
  file: File,
  n: number,
  signal?: AbortSignal,
  onProgress?: ProgressCb,
  onPart?: (r: SplitResult) => void,
): Promise<SplitResult[]> {
  if (n < 1) throw new Error("invalid_every_n");
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const base = baseName(file);
  const parts = Math.ceil(total / n);
  const results: SplitResult[] = [];

  for (let p = 0; p < parts; p++) {
    checkAborted(signal);
    const start = p * n + 1;
    const end = Math.min(start + n - 1, total);
    const indices = indicesRange0(start, end);
    const bytes = await buildPdfFromIndices(src, indices);
    const r: SplitResult = {
      blob: bytesToBlob(bytes),
      filename: `${base}_${start}-${end}.pdf`,
      pageCount: indices.length,
      pageIndices: indices.map((i) => i + 1),
    };
    results.push(r);
    onPart?.(r);
    onProgress?.({ current: p + 1, total: parts, phase: "splitting" });
  }
  return results;
}

export async function splitByOddEven(
  file: File,
  signal?: AbortSignal,
): Promise<SplitResult[]> {
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const base = baseName(file);
  const oddIndices: number[] = [];
  const evenIndices: number[] = [];
  for (let i = 0; i < total; i++) {
    if ((i + 1) % 2 === 1) oddIndices.push(i);
    else evenIndices.push(i);
  }
  const results: SplitResult[] = [];
  if (oddIndices.length > 0) {
    checkAborted(signal);
    const bytes = await buildPdfFromIndices(src, oddIndices);
    results.push({
      blob: bytesToBlob(bytes),
      filename: `${base}_odd.pdf`,
      pageCount: oddIndices.length,
      pageIndices: oddIndices.map((i) => i + 1),
      label: "odd",
    });
  }
  if (evenIndices.length > 0) {
    checkAborted(signal);
    const bytes = await buildPdfFromIndices(src, evenIndices);
    results.push({
      blob: bytesToBlob(bytes),
      filename: `${base}_even.pdf`,
      pageCount: evenIndices.length,
      pageIndices: evenIndices.map((i) => i + 1),
      label: "even",
    });
  }
  return results;
}

export async function splitByHalf(
  file: File,
  signal?: AbortSignal,
): Promise<SplitResult[]> {
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  if (total < 2) throw new Error("too_few_pages_for_half");
  const base = baseName(file);
  const cut = Math.floor(total / 2);
  const firstIndices = indicesRange0(1, cut);
  const secondIndices = indicesRange0(cut + 1, total);
  checkAborted(signal);
  const firstBytes = await buildPdfFromIndices(src, firstIndices);
  checkAborted(signal);
  const secondBytes = await buildPdfFromIndices(src, secondIndices);
  return [
    {
      blob: bytesToBlob(firstBytes),
      filename: `${base}_part1.pdf`,
      pageCount: firstIndices.length,
      pageIndices: firstIndices.map((i) => i + 1),
      label: "first",
    },
    {
      blob: bytesToBlob(secondBytes),
      filename: `${base}_part2.pdf`,
      pageCount: secondIndices.length,
      pageIndices: secondIndices.map((i) => i + 1),
      label: "second",
    },
  ];
}

export async function splitByRange(
  file: File,
  ranges: [number, number][],
  mergeAll = false,
  signal?: AbortSignal,
  onProgress?: ProgressCb,
): Promise<SplitResult[]> {
  if (ranges.length === 0) throw new Error("no_ranges");
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const base = baseName(file);
  const validRanges = ranges.filter(
    ([s, e]) => s >= 1 && e >= s && e <= total,
  );
  if (validRanges.length === 0) throw new Error("no_valid_ranges");

  if (mergeAll) {
    checkAborted(signal);
    const allIndices: number[] = [];
    for (const [s, e] of validRanges) {
      for (let i = s - 1; i < e; i++) allIndices.push(i);
    }
    const bytes = await buildPdfFromIndices(src, allIndices);
    return [
      {
        blob: bytesToBlob(bytes),
        filename: `${base}_extracted.pdf`,
        pageCount: allIndices.length,
        pageIndices: allIndices.map((i) => i + 1),
      },
    ];
  }

  const results: SplitResult[] = [];
  for (let r = 0; r < validRanges.length; r++) {
    checkAborted(signal);
    const [s, e] = validRanges[r];
    const indices = indicesRange0(s, e);
    const bytes = await buildPdfFromIndices(src, indices);
    results.push({
      blob: bytesToBlob(bytes),
      filename: `${base}_${s}-${e}.pdf`,
      pageCount: indices.length,
      pageIndices: indices.map((i) => i + 1),
    });
    onProgress?.({ current: r + 1, total: validRanges.length, phase: "splitting" });
  }
  return results;
}

export async function splitBySize(
  file: File,
  maxBytes: number,
  signal?: AbortSignal,
  onProgress?: ProgressCb,
): Promise<SplitResult[]> {
  if (maxBytes <= 0) throw new Error("invalid_max_size");
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const base = baseName(file);
  const avgPageBytes = file.size / Math.max(total, 1);
  const results: SplitResult[] = [];
  let i = 0;
  let probeCount = 0;

  while (i < total) {
    checkAborted(signal);
    const remaining = total - i;
    const initialGuess = Math.max(
      1,
      Math.min(remaining, Math.ceil(maxBytes / Math.max(avgPageBytes, 1))),
    );

    // single-page oversized handling
    const singleBytes = await buildPdfFromIndices(src, [i]);
    probeCount++;
    onProgress?.({ current: probeCount, total: 0, phase: "probing" });

    if (singleBytes.length > maxBytes) {
      results.push({
        blob: bytesToBlob(singleBytes),
        filename: `${base}_${i + 1}-${i + 1}.pdf`,
        pageCount: 1,
        pageIndices: [i + 1],
        oversized: true,
      });
      i += 1;
      continue;
    }

    // single page already confirmed to fit; search for largest k >= 2
    let low = 2;
    let high = remaining;
    let best = 1;
    let bestBytes: Uint8Array = singleBytes;

    if (low <= high) {
      let mid = Math.min(high, Math.max(low, initialGuess));
      while (low <= high) {
        checkAborted(signal);
        const indices = indicesRange0(i + 1, i + mid);
        const bytes = await buildPdfFromIndices(src, indices);
        probeCount++;
        onProgress?.({ current: probeCount, total: 0, phase: "probing" });

        if (bytes.length <= maxBytes) {
          best = mid;
          bestBytes = bytes;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
        if (low > high) break;
        mid = (low + high) >> 1;
      }
    }

    const start = i + 1;
    const end = i + best;
    results.push({
      blob: bytesToBlob(bestBytes),
      filename: `${base}_${start}-${end}.pdf`,
      pageCount: best,
      pageIndices: indicesRange0(start, end).map((idx) => idx + 1),
    });
    i += best;
  }
  return results;
}

export interface OutlineSection {
  title: string;
  pageIndex: number; // 0-based
}

export async function readOutlineSections(
  file: File,
): Promise<OutlineSection[]> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs runtime type loose
  const doc: any = await pdfjs.getDocument({ data: buf }).promise;
  const outline = await doc.getOutline();
  if (!outline || outline.length === 0) return [];
  const out: OutlineSection[] = [];
  for (const item of outline) {
    let dest = item.dest;
    if (typeof dest === "string") {
      try {
        dest = await doc.getDestination(dest);
      } catch {
        continue;
      }
    }
    if (!Array.isArray(dest) || !dest[0]) continue;
    try {
      const pageIndex = await doc.getPageIndex(dest[0]);
      out.push({
        title: item.title || `Section ${out.length + 1}`,
        pageIndex,
      });
    } catch {
      continue;
    }
  }
  out.sort((a, b) => a.pageIndex - b.pageIndex);
  return out;
}

export async function splitByOutline(
  file: File,
  signal?: AbortSignal,
  onProgress?: ProgressCb,
): Promise<SplitResult[]> {
  const sections = await readOutlineSections(file);
  if (sections.length === 0) throw new Error("no_outline");

  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const usedNames = new Map<string, number>();
  const results: SplitResult[] = [];

  for (let s = 0; s < sections.length; s++) {
    checkAborted(signal);
    const start1 = sections[s].pageIndex + 1;
    const end1 = s + 1 < sections.length ? sections[s + 1].pageIndex : total;
    if (end1 < start1) continue;
    const indices = indicesRange0(start1, end1);
    const bytes = await buildPdfFromIndices(src, indices);

    const safeBase = sanitizeFilename(sections[s].title, `section_${s + 1}`);
    const seen = usedNames.get(safeBase) ?? 0;
    usedNames.set(safeBase, seen + 1);
    const filename = seen === 0 ? `${safeBase}.pdf` : `${safeBase}_${seen + 1}.pdf`;

    results.push({
      blob: bytesToBlob(bytes),
      filename,
      pageCount: indices.length,
      pageIndices: indices.map((i) => i + 1),
      label: sections[s].title,
    });
    onProgress?.({ current: s + 1, total: sections.length, phase: "splitting" });
  }
  if (results.length === 0) throw new Error("no_outline");
  return results;
}

export async function packAsZip(
  results: SplitResult[],
  zipName: string,
): Promise<{ blob: Blob; filename: string }> {
  const files: Record<string, Uint8Array> = {};
  for (const r of results) {
    const dot = r.filename.lastIndexOf(".");
    const stem = dot > 0 ? r.filename.slice(0, dot) : r.filename;
    const ext = dot > 0 ? r.filename.slice(dot) : "";
    let key = r.filename;
    let suffix = 1;
    while (files[key] !== undefined) {
      suffix++;
      key = `${stem}_${suffix}${ext}`;
    }
    const buf = await r.blob.arrayBuffer();
    files[key] = new Uint8Array(buf);
  }
  const zipped = zipSync(files);
  return {
    blob: new Blob([zipped as BlobPart], { type: "application/zip" }),
    filename: zipName,
  };
}

export function parseRanges(input: string): [number, number][] {
  const out: [number, number][] = [];
  for (const raw of input.split(",")) {
    const seg = raw.trim();
    if (!seg) continue;
    const parts = seg.split("-").map((p) => Number(p.trim()));
    if (parts.length > 2) continue;
    const a = parts[0];
    const b = parts.length === 1 ? parts[0] : parts[1];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a < 1 || b < a) continue;
    out.push([a, b]);
  }
  return out;
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
