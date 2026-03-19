import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export type Quality = "high" | "medium" | "low";

const CRF_MAP: Record<Quality, number> = {
  high: 23,
  medium: 28,
  low: 35,
};

export async function compressVideo(
  file: File,
  quality: Quality,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const outputName = "compressed_out.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i", inputName,
      "-c:v", "libx264",
      "-crf", String(CRF_MAP[quality]),
      "-preset", "fast",
      "-c:a", "aac",
      "-b:a", "128k",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: "video/mp4" });
  } finally {
    try { await ffmpeg.deleteFile(inputName); } catch { /* ignore */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }
  }
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".mp4";
}
