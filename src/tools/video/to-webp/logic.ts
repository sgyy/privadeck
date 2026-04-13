import { execWithMount } from "@/lib/ffmpeg";

export type WebpQuality = "small" | "balanced" | "high";

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
  const outputName = "output.webp";

  const data = await execWithMount(file, (inputPath) => {
    const args: string[] = [];
    if (options.startTime !== undefined && options.startTime > 0) {
      args.push("-ss", String(options.startTime));
    }
    args.push("-i", inputPath);
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
    return args;
  }, outputName, onProgress);
  return new Blob([data as BlobPart], { type: "image/webp" });
}
