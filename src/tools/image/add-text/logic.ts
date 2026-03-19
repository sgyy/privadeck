export type TextPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export async function addTextToImage(
  file: File,
  options: {
    text: string;
    fontSize: number;
    color: string;
    position: TextPosition;
  },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      ctx.font = `${options.fontSize}px sans-serif`;
      ctx.fillStyle = options.color;
      ctx.textBaseline = "middle";

      const margin = 20;
      let x = 0,
        y = 0;

      switch (options.position) {
        case "center":
          ctx.textAlign = "center";
          x = canvas.width / 2;
          y = canvas.height / 2;
          break;
        case "top-left":
          ctx.textAlign = "left";
          x = margin;
          y = margin + options.fontSize / 2;
          break;
        case "top-right":
          ctx.textAlign = "right";
          x = canvas.width - margin;
          y = margin + options.fontSize / 2;
          break;
        case "bottom-left":
          ctx.textAlign = "left";
          x = margin;
          y = canvas.height - margin - options.fontSize / 2;
          break;
        case "bottom-right":
          ctx.textAlign = "right";
          x = canvas.width - margin;
          y = canvas.height - margin - options.fontSize / 2;
          break;
      }

      ctx.fillText(options.text, x, y);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Failed"));
            return;
          }
          resolve(blob);
        },
        file.type || "image/png",
        0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
