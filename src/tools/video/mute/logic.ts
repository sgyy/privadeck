import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export async function muteVideo(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const outputName = "output" + getExtension(file.name);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(["-i", inputName, "-an", "-c:v", "copy", outputName]);

    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: file.type || "video/mp4" });
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

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp4";
}
