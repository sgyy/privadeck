export interface ExifResult {
  original: File;
  cleaned: Blob;
  originalSize: number;
  cleanedSize: number;
  outputFilename: string;
}

const SUPPORTED_TYPES: Record<string, { mime: string; ext: string; quality?: number }> = {
  "image/png": { mime: "image/png", ext: ".png" },
  "image/jpeg": { mime: "image/jpeg", ext: ".jpg", quality: 0.95 },
  "image/webp": { mime: "image/webp", ext: ".webp", quality: 0.95 },
};

export async function removeExif(file: File): Promise<ExifResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Preserve original format if supported, otherwise fall back to PNG
        const typeInfo = SUPPORTED_TYPES[file.type] || SUPPORTED_TYPES["image/png"];

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to process image"));
              return;
            }

            // Ensure filename extension matches output format
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const outputFilename = baseName + typeInfo.ext;

            resolve({
              original: file,
              cleaned: blob,
              originalSize: file.size,
              cleanedSize: blob.size,
              outputFilename,
            });
          },
          typeInfo.mime,
          typeInfo.quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
