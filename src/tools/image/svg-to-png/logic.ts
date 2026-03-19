export async function svgToPng(file: File, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      let svgText = reader.result as string;

      // If SVG lacks width/height but has viewBox, inject dimensions from viewBox
      // so the <img> element gets intrinsic dimensions
      if (!/\bwidth\s*=/.test(svgText)) {
        const vbMatch = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/);
        if (vbMatch) {
          const parts = vbMatch[1].trim().split(/[\s,]+/);
          if (parts.length === 4) {
            svgText = svgText.replace(
              "<svg",
              `<svg width="${parts[2]}" height="${parts[3]}"`
            );
          }
        }
      }

      const img = new Image();
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        if (img.width === 0 || img.height === 0) {
          URL.revokeObjectURL(url);
          reject(new Error("SVG has no dimensions. Ensure it has width/height or a viewBox attribute."));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error("Conversion failed"));
              return;
            }
            resolve(blob);
          },
          "image/png"
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG"));
      };
      img.src = url;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
