export type OutputFormat = "png" | "jpeg" | "webp" | "ico";

export interface ConvertedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
  filename: string;
}

const FORMAT_MIME: Record<OutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  ico: "image/png", // ICO uses PNG internally for modern browsers
};

const FORMAT_EXT: Record<OutputFormat, string> = {
  png: ".png",
  jpeg: ".jpg",
  webp: ".webp",
  ico: ".ico",
};

export async function convertImage(
  file: File,
  format: OutputFormat,
  quality: number = 0.9,
): Promise<ConvertedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // ICO files are typically 256x256 max
        if (format === "ico") {
          const maxSize = 256;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Conversion failed"));
              return;
            }

            const baseName = file.name.replace(/\.[^.]+$/, "");
            const url = URL.createObjectURL(blob);

            resolve({
              blob,
              url,
              width,
              height,
              originalSize: file.size,
              convertedSize: blob.size,
              filename: baseName + FORMAT_EXT[format],
            });
          },
          FORMAT_MIME[format],
          format === "png" || format === "ico" ? undefined : quality,
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
