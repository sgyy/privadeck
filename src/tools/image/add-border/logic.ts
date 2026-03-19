export async function addBorder(
  file: File,
  borderWidth: number,
  color: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width + borderWidth * 2;
      canvas.height = img.height + borderWidth * 2;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, borderWidth, borderWidth);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Failed"));
            return;
          }
          resolve(blob);
        },
        "image/png"
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
