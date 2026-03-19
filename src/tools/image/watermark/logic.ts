export interface WatermarkOptions {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tile";
}

export async function addWatermark(
  file: File,
  options: WatermarkOptions,
): Promise<Blob> {
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
        ctx.globalAlpha = options.opacity;
        ctx.fillStyle = options.color;
        ctx.font = `${options.fontSize}px sans-serif`;

        if (options.position === "tile") {
          const metrics = ctx.measureText(options.text);
          const textWidth = metrics.width;
          const textHeight = options.fontSize;
          const gap = 50;

          ctx.save();
          ctx.rotate(-Math.PI / 6);
          for (let y = -canvas.height; y < canvas.height * 2; y += textHeight + gap) {
            for (let x = -canvas.width; x < canvas.width * 2; x += textWidth + gap) {
              ctx.fillText(options.text, x, y);
            }
          }
          ctx.restore();
        } else {
          const metrics = ctx.measureText(options.text);
          const textWidth = metrics.width;
          let x = 0;
          let y = 0;
          const pad = 20;

          switch (options.position) {
            case "center":
              x = (canvas.width - textWidth) / 2;
              y = canvas.height / 2;
              break;
            case "top-left":
              x = pad;
              y = options.fontSize + pad;
              break;
            case "top-right":
              x = canvas.width - textWidth - pad;
              y = options.fontSize + pad;
              break;
            case "bottom-left":
              x = pad;
              y = canvas.height - pad;
              break;
            case "bottom-right":
              x = canvas.width - textWidth - pad;
              y = canvas.height - pad;
              break;
          }

          ctx.fillText(options.text, x, y);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Watermark failed"));
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
