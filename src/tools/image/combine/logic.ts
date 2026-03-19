export type CombineLayout = "horizontal" | "vertical";

export async function combineImages(
  files: File[],
  layout: CombineLayout,
): Promise<Blob> {
  const images = await Promise.all(files.map(loadImage));

  let totalWidth = 0,
    totalHeight = 0;
  if (layout === "horizontal") {
    totalWidth = images.reduce((sum, img) => sum + img.width, 0);
    totalHeight = Math.max(...images.map((img) => img.height));
  } else {
    totalWidth = Math.max(...images.map((img) => img.width));
    totalHeight = images.reduce((sum, img) => sum + img.height, 0);
  }

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d")!;

  // Fill with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let offset = 0;
  for (const img of images) {
    if (layout === "horizontal") {
      // Center vertically
      const y = Math.round((totalHeight - img.height) / 2);
      ctx.drawImage(img.el, offset, y);
      offset += img.width;
    } else {
      // Center horizontally
      const x = Math.round((totalWidth - img.width) / 2);
      ctx.drawImage(img.el, x, offset);
      offset += img.height;
    }
  }

  // Revoke image URLs before toBlob — they are no longer needed after drawing
  images.forEach((img) => URL.revokeObjectURL(img.url));

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Combine failed"));
          return;
        }
        resolve(blob);
      },
      "image/png",
    );
  });
}

function loadImage(
  file: File,
): Promise<{
  el: HTMLImageElement;
  width: number;
  height: number;
  url: string;
}> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    const url = URL.createObjectURL(file);
    el.onload = () => resolve({ el, width: el.width, height: el.height, url });
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    el.src = url;
  });
}
