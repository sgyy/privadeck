export type CollageLayout = "2x1" | "1x2" | "2x2" | "3x1" | "1x3" | "2x3";

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

function parseLayout(layout: CollageLayout): { cols: number; rows: number } {
  const [cols, rows] = layout.split("x").map(Number);
  return { cols, rows };
}

export function getRequiredCount(layout: CollageLayout): number {
  const { cols, rows } = parseLayout(layout);
  return cols * rows;
}

export function getAvailableLayouts(imageCount: number): CollageLayout[] {
  const all: CollageLayout[] = ["2x1", "1x2", "2x2", "3x1", "1x3", "2x3"];
  return all.filter((l) => getRequiredCount(l) <= imageCount);
}

export async function createCollage(
  files: File[],
  layout: CollageLayout,
  gap: number,
  bgColor: string,
): Promise<Blob> {
  const { cols, rows } = parseLayout(layout);
  const totalCells = cols * rows;

  // Load only the images we need
  const images = await Promise.all(
    files.slice(0, totalCells).map(loadImage),
  );

  // Calculate cell size based on the largest image dimensions, capped to avoid OOM
  const MAX_CELL = 1200;
  const maxW = Math.max(...images.map((img) => img.width));
  const maxH = Math.max(...images.map((img) => img.height));
  const cellW = Math.min(maxW, MAX_CELL);
  const cellH = Math.min(maxH, MAX_CELL);

  const canvasWidth = cols * cellW + (cols + 1) * gap;
  const canvasHeight = rows * cellH + (rows + 1) * gap;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  try {
    // Draw images in grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (idx >= images.length) break;

        const img = images[idx];
        const cellX = gap + col * (cellW + gap);
        const cellY = gap + row * (cellH + gap);

        // Scale to fit (contain mode)
        const scaleX = cellW / img.width;
        const scaleY = cellH / img.height;
        const scale = Math.min(scaleX, scaleY);

        const drawW = Math.round(img.width * scale);
        const drawH = Math.round(img.height * scale);

        // Center within cell
        const drawX = cellX + Math.round((cellW - drawW) / 2);
        const drawY = cellY + Math.round((cellH - drawH) / 2);

        ctx.drawImage(img.el, drawX, drawY, drawW, drawH);
      }
    }

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Collage creation failed"));
            return;
          }
          resolve(blob);
        },
        "image/png",
      );
    });
  } finally {
    images.forEach((img) => URL.revokeObjectURL(img.url));
  }
}
