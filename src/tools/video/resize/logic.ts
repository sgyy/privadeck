import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export type ResizePreset = "720p" | "480p" | "360p" | "custom";

const PRESET_MAP: Record<Exclude<ResizePreset, "custom">, string> = {
  "720p": "1280:-2",
  "480p": "854:-2",
  "360p": "640:-2",
};

export async function resizeVideo(
  file: File,
  preset: ResizePreset,
  customWidth?: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  setProgressHandler(onProgress ?? null);
  const ext = getExtension(file.name);
  const inputName = "input" + ext;
  const outputName = "resized_out.mp4";

  // Ensure width is even (required by libx264 with -2 height)
  const evenWidth = customWidth ? Math.round(customWidth / 2) * 2 : 1280;
  const scale =
    preset === "custom"
      ? `${evenWidth}:-2`
      : PRESET_MAP[preset as Exclude<ResizePreset, "custom">] || "1280:-2";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale=${scale}`,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: "video/mp4" });
  } finally {
    setProgressHandler(null);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* ignore */
    }
  }
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".mp4";
}
