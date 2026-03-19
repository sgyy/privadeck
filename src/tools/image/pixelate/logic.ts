export async function pixelateImage(
  file: File,
  pixelSize: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      const smallW = Math.ceil(img.width / pixelSize);
      const smallH = Math.ceil(img.height / pixelSize);

      // Use a separate offscreen canvas for downscale to avoid
      // same-canvas source/destination overlap corruption
      const offscreen = document.createElement("canvas");
      offscreen.width = smallW;
      offscreen.height = smallH;
      const offCtx = offscreen.getContext("2d")!;
      offCtx.imageSmoothingEnabled = true;
      offCtx.drawImage(img, 0, 0, smallW, smallH);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Pixelate failed"));
            return;
          }
          resolve(blob);
        },
        file.type || "image/png",
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
