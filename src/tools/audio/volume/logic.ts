import { execWithMount } from "@/lib/ffmpeg";

export async function adjustVolume(
  file: File,
  volumePercent: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ext = getExtension(file.name);
  const outputName = "volume_out" + ext;
  const volumeMultiplier = (volumePercent / 100).toFixed(2);

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath,
    "-filter:a", `volume=${volumeMultiplier}`,
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: file.type || "audio/mpeg" });
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp3";
}
