import { execWithMount } from "@/lib/ffmpeg";

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".aac": "audio/aac",
  ".opus": "audio/opus",
  ".weba": "audio/webm",
  ".webm": "audio/webm",
};

export type VolumeUnit = "percent" | "db";

export async function adjustVolume(
  file: File,
  value: number,
  unit: VolumeUnit = "percent",
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ext = getExtension(file.name);
  const outputName = "volume_out" + ext;
  const filterValue = unit === "db" ? `${value.toFixed(2)}dB` : (value / 100).toFixed(2);

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath,
    "-filter:a", `volume=${filterValue}`,
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: outputMime(ext, file.type) });
}

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function gainToDb(gain: number): number {
  return gain > 0 ? 20 * Math.log10(gain) : -Infinity;
}

function outputMime(ext: string, fallback: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] ?? fallback ?? "application/octet-stream";
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp3";
}
