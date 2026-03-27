import { execWithMount } from "@/lib/ffmpeg";

export async function muteVideo(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ext = getExtension(file.name);
  const outputName = "muted_out" + ext;

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath, "-an", "-c:v", "copy", outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: file.type || "video/mp4" });
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp4";
}
