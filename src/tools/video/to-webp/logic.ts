import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export interface WebpOptions {
  fps: number;
  width: number;
  quality: number;
  startTime?: number;
  endTime?: number;
}

export async function videoToWebp(
  file: File,
  options: WebpOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const outputName = "output.webp";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args: string[] = [];
    if (options.startTime !== undefined && options.startTime > 0) {
      args.push("-ss", String(options.startTime));
    }
    args.push("-i", inputName);
    if (options.endTime !== undefined) {
      const duration = options.endTime - (options.startTime || 0);
      if (duration > 0) args.push("-t", String(duration));
    }

    args.push(
      "-vf", `fps=${options.fps},scale=${options.width}:-1`,
      "-vcodec", "libwebp",
      "-lossless", "0",
      "-compression_level", "3",
      "-q:v", String(options.quality),
      "-loop", "0",
      "-an",
      outputName,
    );

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: "image/webp" });
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
