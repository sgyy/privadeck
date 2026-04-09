export interface CropOptions {
  outputFormat?: string; // mime type e.g. "image/webp"
  quality?: number; // 0-1
}

/**
 * Convert a canvas element to a Blob with the specified format and quality.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  options: CropOptions = {},
): Promise<Blob> {
  const { quality = 0.92 } = options;
  const mime = options.outputFormat || "image/png";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image"));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}
