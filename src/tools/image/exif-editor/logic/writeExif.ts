import type { EditableFields } from "../types";
import { isWriteableMime, resolveMime } from "../types";
import { writeJpegExif } from "./writeJpegExif";
import { writePngExif } from "./writePngExif";
import { writeWebpExif } from "./writeWebpExif";

export async function writeExif(
  file: File,
  edits: EditableFields,
): Promise<Blob> {
  const mime = resolveMime(file);
  if (!isWriteableMime(mime)) {
    throw new Error(`Format not writeable: ${mime}`);
  }
  switch (mime) {
    case "image/jpeg":
      return writeJpegExif(file, edits);
    case "image/png":
      return writePngExif(file, edits);
    case "image/webp":
      return writeWebpExif(file, edits);
    default:
      throw new Error(`Unsupported MIME: ${mime}`);
  }
}

export function editedFilename(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "");
  const ext = extFromMime(resolveMime(file)) ?? extFromName(file.name);
  return `${base}-edited${ext}`;
}

function extFromMime(mime: string): string | null {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return null;
}

function extFromName(name: string): string {
  const m = name.match(/\.[^.]+$/);
  return m ? m[0] : "";
}
