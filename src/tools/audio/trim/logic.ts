import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export async function trimAudio(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const ext = getExtension(file.name);
  const inputName = "input" + ext;
  const outputName = "output" + ext;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-ss", formatTime(startTime),
      "-i", inputName,
      "-t", formatTime(endTime - startTime),
      "-c", "copy",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: file.type || "audio/mpeg" });
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

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export function formatTimeDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp3";
}
