import { execWithMount } from "@/lib/ffmpeg";

export async function trimAudio(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ext = getExtension(file.name);
  const outputName = "trimmed_out" + ext;

  const data = await execWithMount(file, (inputPath) => [
    "-ss", formatTime(startTime),
    "-i", inputPath,
    "-t", formatTime(endTime - startTime),
    "-c", "copy",
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: file.type || "audio/mpeg" });
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
