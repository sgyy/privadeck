import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export interface GifOptions {
  fps: number;
  width: number;
  startTime?: number;
  endTime?: number;
}

export async function videoToGif(
  file: File,
  options: GifOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const outputName = "output.gif";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Place -ss before -i for fast input seek
    const args: string[] = [];
    if (options.startTime !== undefined && options.startTime > 0) {
      args.push("-ss", String(options.startTime));
    }
    args.push("-i", inputName);
    if (options.endTime !== undefined) {
      // With input seek, -t (duration) is relative to seek point
      const duration = options.endTime - (options.startTime || 0);
      if (duration > 0) args.push("-t", String(duration));
    }

    args.push(
      "-vf",
      `fps=${options.fps},scale=${options.width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      "-loop", "0",
      outputName,
    );

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: "image/gif" });
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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
