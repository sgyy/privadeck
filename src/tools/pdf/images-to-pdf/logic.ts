import { PDFDocument } from "pdf-lib";

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let image;

    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      image = await pdfDoc.embedJpg(bytes);
    } else if (file.type === "image/png") {
      image = await pdfDoc.embedPng(bytes);
    } else {
      // Convert other formats to PNG via canvas
      const pngBytes = await convertToPng(file);
      image = await pdfDoc.embedPng(pngBytes);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

async function convertToPng(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Conversion failed"));
            return;
          }
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
        },
        "image/png",
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export { formatFileSize } from "@/lib/utils/formatFileSize";
