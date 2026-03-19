import { getPdfjs } from "@/lib/pdfjs";

export async function extractText(file: File): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => "str" in item)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.str)
      .join(" ");
    if (pageText.trim()) {
      textParts.push(`--- Page ${i} ---\n${pageText}`);
    }
  }

  return textParts.join("\n\n");
}
