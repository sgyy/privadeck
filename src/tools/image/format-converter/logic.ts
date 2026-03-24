export type OutputFormat = "png" | "jpeg" | "webp" | "avif" | "ico";

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
  avif: "image/avif",
  ico: "image/png", // ICO uses PNG internally for modern browsers
};

const FORMAT_EXT: Record<OutputFormat, string> = {
  png: ".png",
  jpeg: ".jpg",
  webp: ".webp",
  avif: ".avif",
  ico: ".ico",
};

function loadImageToCanvas(
  file: File,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

async function convertImageToAvif(
  file: File,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const { canvas, width, height } = await loadImageToCanvas(file);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, width, height);

  const { encode } = await import("@jsquash/avif");
  // quality 0-1 → jsquash quality 0-100
  const avifBuffer = await encode(imageData, {
    quality: Math.round(quality * 100),
    speed: 6,
  });

  const blob = new Blob([avifBuffer], { type: "image/avif" });
  return { blob, width, height };
}

export async function convertImage(
  file: File,
  format: OutputFormat,
  quality: number = 0.9,
): Promise<ConvertedImage> {
  const baseName = file.name.replace(/\.[^.]+$/, "");

  if (format === "avif") {
    const result = await convertImageToAvif(file, quality);
    const url = URL.createObjectURL(result.blob);
    return {
      blob: result.blob,
      url,
      width: result.width,
      height: result.height,
      originalSize: file.size,
      convertedSize: result.blob.size,
      filename: baseName + FORMAT_EXT[format],
    };
  }

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

export { formatFileSize } from "@/lib/utils/formatFileSize";
