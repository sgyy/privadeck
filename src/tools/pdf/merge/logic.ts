import { PDFDocument, degrees, type PDFImage } from "pdf-lib";

export type MergeItem =
  | {
      id: string;
      kind: "pdf";
      file: File;
      pageIndices: number[];
      rotations: Record<number, number>;
    }
  | { id: string; kind: "image"; file: File }
  | { id: string; kind: "blank" };

export interface MergeOptions {
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

export async function mergeItems(
  items: MergeItem[],
  opts?: MergeOptions,
): Promise<Blob> {
  const out = await PDFDocument.create();
  let lastPageSize: [number, number] = [595, 842];

  for (const item of items) {
    if (item.kind === "pdf") {
      const bytes = new Uint8Array(await item.file.arrayBuffer());
      const src = await PDFDocument.load(bytes);
      const pages = await out.copyPages(src, item.pageIndices);
      pages.forEach((page, i) => {
        const orig = item.pageIndices[i];
        const rot = item.rotations[orig] ?? 0;
        if (rot !== 0) {
          const cur = page.getRotation().angle;
          page.setRotation(degrees((((cur + rot) % 360) + 360) % 360));
        }
        out.addPage(page);
        const { width, height } = page.getSize();
        lastPageSize = [width, height];
      });
    } else if (item.kind === "image") {
      const image = await embedImage(out, item.file);
      const [pageW, pageH] = lastPageSize;
      const scale = Math.min(pageW / image.width, pageH / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      const page = out.addPage([pageW, pageH]);
      page.drawImage(image, {
        x: (pageW - w) / 2,
        y: (pageH - h) / 2,
        width: w,
        height: h,
      });
      // Keep lastPageSize unchanged so the document maintains a consistent page size.
    } else {
      out.addPage(lastPageSize);
    }
  }

  const meta = opts?.metadata;
  if (meta?.title) out.setTitle(meta.title);
  if (meta?.author) out.setAuthor(meta.author);
  if (meta?.subject) out.setSubject(meta.subject);
  if (meta?.keywords) {
    const kws = meta.keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (kws.length > 0) out.setKeywords(kws);
  }
  // Intentionally do NOT setProducer/setCreator — leaving the default keeps
  // the output PDF free of any third-party branding, matching the privacy-first
  // positioning. Users merging confidential documents should not see "PrivaDeck"
  // baked into their PDF metadata.

  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

async function embedImage(pdf: PDFDocument, file: File): Promise<PDFImage> {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") {
    return pdf.embedJpg(new Uint8Array(await file.arrayBuffer()));
  }
  if (type === "image/png") {
    return pdf.embedPng(new Uint8Array(await file.arrayBuffer()));
  }
  const pngBytes = await imageFileToPng(file);
  return pdf.embedPng(pngBytes);
}

async function imageFileToPng(file: File): Promise<Uint8Array> {
  let blob: Blob = file;
  const isHeic =
    /^image\/heic|^image\/heif/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name);
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const r = await heic2any({ blob: file, toType: "image/png" });
    blob = Array.isArray(r) ? r[0] : (r as Blob);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        URL.revokeObjectURL(url);
        if (!b) {
          reject(new Error("PNG conversion failed"));
          return;
        }
        b.arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
