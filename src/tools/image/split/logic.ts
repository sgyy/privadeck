import { zipSync } from "fflate";

export async function splitImage(
  file: File,
  rows: number,
  cols: number,
): Promise<Array<{ blob: Blob; filename: string }>> {
  const img = await loadImg(file);
  const pieceW = Math.floor(img.width / cols);
  const pieceH = Math.floor(img.height / rows);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const results: Array<{ blob: Blob; filename: string }> = [];

  try {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Last tile absorbs remainder pixels
        const tileW = c === cols - 1 ? img.width - c * pieceW : pieceW;
        const tileH = r === rows - 1 ? img.height - r * pieceH : pieceH;
        const canvas = document.createElement("canvas");
        canvas.width = tileW;
        canvas.height = tileH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
          img.el,
          c * pieceW,
          r * pieceH,
          tileW,
          tileH,
          0,
          0,
          tileW,
          tileH,
        );

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) =>
            b ? resolve(b) : reject(new Error("Split failed")),
            "image/png",
          );
        });
        results.push({ blob, filename: `${baseName}_${r + 1}x${c + 1}.png` });
      }
    }
    return results;
  } finally {
    URL.revokeObjectURL(img.url);
  }
}

export async function downloadAsZip(
  pieces: Array<{ blob: Blob; filename: string }>,
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  for (const piece of pieces) {
    files[piece.filename] = new Uint8Array(await piece.blob.arrayBuffer());
  }
  const zipped = zipSync(files);
  return new Blob([zipped as BlobPart], { type: "application/zip" });
}

function loadImg(
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
