import { unzip } from "fflate";
import { brandFilename } from "@/lib/brand";

export interface ArchiveEntry {
  path: string;
  size: number;
  isDirectory: boolean;
  data?: Uint8Array;
}

function unzipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(data, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export async function extractZip(file: File): Promise<ArchiveEntry[]> {
  const buffer = await file.arrayBuffer();
  const unzipped = await unzipAsync(new Uint8Array(buffer));

  const entries: ArchiveEntry[] = [];

  for (const [path, data] of Object.entries(unzipped)) {
    entries.push({
      path,
      size: data.length,
      isDirectory: path.endsWith("/"),
      data,
    });
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

export function downloadEntry(entry: ArchiveEntry) {
  if (!entry.data || entry.isDirectory) return;
  const blob = new Blob([entry.data as BlobPart]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = brandFilename(entry.path.split("/").pop() || entry.path);
  a.click();
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) return "file";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"];
  const codeExts = ["js", "ts", "tsx", "jsx", "html", "css", "json", "xml"];
  const docExts = ["pdf", "doc", "docx", "txt", "md"];
  if (imageExts.includes(ext)) return "image";
  if (codeExts.includes(ext)) return "code";
  if (docExts.includes(ext)) return "document";
  return "file";
}
