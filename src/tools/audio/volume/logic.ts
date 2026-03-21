import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export async function adjustVolume(
  file: File,
  volumePercent: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const ext = getExtension(file.name);
  const inputName = "input" + ext;
  const outputName = "output" + ext;
  const volumeMultiplier = (volumePercent / 100).toFixed(2);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i", inputName,
      "-filter:a", `volume=${volumeMultiplier}`,
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

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp3";
}
