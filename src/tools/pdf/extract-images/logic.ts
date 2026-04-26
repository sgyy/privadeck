import { zipSync } from "fflate";
import { getPdfjs } from "@/lib/pdfjs";

export interface ExtractedImage {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  page: number;
}

export async function extractImages(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<ExtractedImage[]> {
  const pdfjsLib = await getPdfjs();
  const OPS = pdfjsLib.OPS;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const baseName = file.name.replace(/\.pdf$/i, "");
  const results: ExtractedImage[] = [];

  try {
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const operatorList = await page.getOperatorList();

      // Collect image object names from operator list
      // In pdfjs v5, all images (including JPEG) use paintImageXObject
      const imageNames = new Set<string>();
      for (let j = 0; j < operatorList.fnArray.length; j++) {
        if (operatorList.fnArray[j] === OPS.paintImageXObject) {
          const name = operatorList.argsArray[j][0];
          if (typeof name === "string") {
            imageNames.add(name);
          }
        }
      }

      for (const imageName of imageNames) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs internal image objects are not fully typed
          const imgData: any = await new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs objs.get callback typing
            (page.objs as any).get(imageName, (data: any) => {
              if (data) resolve(data);
              else reject(new Error(`Failed to get image: ${imageName}`));
            });
          });

          let blob: Blob;
          let width: number;
          let height: number;

          if (imgData.bitmap) {
            // ImageBitmap path (pdfjs v5 primary path)
            width = imgData.width;
            height = imgData.height;
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context not available");
            ctx.drawImage(imgData.bitmap, 0, 0);
            blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) =>
                  b ? resolve(b) : reject(new Error("Failed to convert image")),
                "image/png",
              );
            });
          } else if (imgData.src) {
            // Legacy JPEG URL path
            const response = await fetch(imgData.src);
            blob = await response.blob();
            width = imgData.width;
            height = imgData.height;
          } else if (imgData.data && imgData.width && imgData.height) {
            // Raw pixel data path
            width = imgData.width;
            height = imgData.height;
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context not available");

            const imageData = ctx.createImageData(width, height);
            const srcData = imgData.data as Uint8ClampedArray;

            if (srcData.length === width * height * 4) {
              imageData.data.set(srcData);
            } else if (srcData.length === width * height * 3) {
              for (let p = 0, q = 0; p < srcData.length; p += 3, q += 4) {
                imageData.data[q] = srcData[p];
                imageData.data[q + 1] = srcData[p + 1];
                imageData.data[q + 2] = srcData[p + 2];
                imageData.data[q + 3] = 255;
              }
            } else {
              continue;
            }

            ctx.putImageData(imageData, 0, 0);
            blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) =>
                  b ? resolve(b) : reject(new Error("Failed to convert image")),
                "image/png",
              );
            });
          } else {
            continue;
          }

          const imgIndex = results.length + 1;
          const ext = blob.type === "image/jpeg" ? "jpg" : "png";
          results.push({
            blob,
            filename: `${baseName}_page${i}_img${imgIndex}.${ext}`,
            width,
            height,
            page: i,
          });
        } catch {
          // Skip images that fail to extract
          continue;
        }
      }

      onProgress?.(i, totalPages);
    }
  } finally {
    pdf.destroy();
  }

  return results;
}

export async function downloadImagesAsZip(
  images: ExtractedImage[],
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};

  for (const img of images) {
    const buffer = await img.blob.arrayBuffer();
    files[img.filename] = new Uint8Array(buffer);
  }

  const zipped = zipSync(files);
  return new Blob([zipped as BlobPart], { type: "application/zip" });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
