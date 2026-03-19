export interface ResizeOptions {
  width: number;
  height: number;
}

export async function resizeImage(
  file: File,
  options: ResizeOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = options.width;
        canvas.height = options.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, options.width, options.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Resize failed"));
              return;
            }
            resolve(blob);
          },
          file.type || "image/png",
          0.92,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Calculate dimensions that fit within target while keeping aspect ratio */
export function fitDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(
    targetWidth / originalWidth,
    targetHeight / originalHeight,
  );
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

export const PRESETS = [
  { label: "HD (1280×720)", width: 1280, height: 720 },
  { label: "Full HD (1920×1080)", width: 1920, height: 1080 },
  { label: "2K (2560×1440)", width: 2560, height: 1440 },
  { label: "4K (3840×2160)", width: 3840, height: 2160 },
  { label: "Instagram (1080×1080)", width: 1080, height: 1080 },
  { label: "Twitter (1200×675)", width: 1200, height: 675 },
];
