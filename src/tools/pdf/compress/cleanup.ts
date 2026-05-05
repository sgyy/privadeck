import { PDFDocument } from "pdf-lib";
import type { CleanupOptions } from "./types";

export const FALLBACK_THRESHOLD = 0.95;

export function applyCleanup(doc: PDFDocument, cleanup?: CleanupOptions): void {
  if (!cleanup?.removeMetadata) return;
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("");
  doc.setCreator("");
}

export async function buildOriginalWithCleanup(
  bytes: Uint8Array,
  cleanup?: CleanupOptions,
): Promise<Uint8Array> {
  if (!cleanup?.removeMetadata) return bytes;
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  applyCleanup(doc, cleanup);
  return doc.save();
}
