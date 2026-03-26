import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export type Quality = "high" | "medium" | "low";

export type FFmpegPreset =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow"
  | "slower"
  | "veryslow";

export type ResolutionOption = "original" | "1080p" | "720p" | "480p" | "360p";

export type FpsOption = "original" | "30" | "24" | "15";

export interface CompressOptions {
  crf: number;
  preset: FFmpegPreset;
  resolution: ResolutionOption;
  fps: FpsOption;
  audioBitrate: string;
  maxBitrate?: string;
}

export const PRESET_OPTIONS: Record<Quality, CompressOptions> = {
  high: {
    crf: 23,
    preset: "fast",
    resolution: "original",
    fps: "original",
    audioBitrate: "192k",
  },
  medium: {
    crf: 28,
    preset: "fast",
    resolution: "original",
    fps: "original",
    audioBitrate: "128k",
  },
  low: {
    crf: 35,
    preset: "fast",
    resolution: "720p",
    fps: "original",
    audioBitrate: "96k",
  },
};

export const RESOLUTION_HEIGHT: Record<Exclude<ResolutionOption, "original">, number> = {
  "1080p": 1080,
  "720p": 720,
  "480p": 480,
  "360p": 360,
};

export async function compressVideo(
  file: File,
  options: Quality | CompressOptions,
  onProgress?: (progress: number) => void,
  sourceHeight?: number,
  sourceFps?: number,
): Promise<Blob> {
  const opts: CompressOptions =
    typeof options === "string" ? PRESET_OPTIONS[options] : options;

  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const outputName = "compressed_out.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args: string[] = ["-i", inputName];

    // Video filters
    const filters: string[] = [];
    if (opts.resolution !== "original") {
      const h = RESOLUTION_HEIGHT[opts.resolution];
      // Skip upscale: only downscale if target is smaller than source
      if (!sourceHeight || h < sourceHeight) {
        filters.push(`scale=-2:${h}`);
      }
    }
    if (opts.fps !== "original") {
      const targetFps = Number(opts.fps);
      // Skip if target fps exceeds source fps
      if (!sourceFps || targetFps < sourceFps) {
        filters.push(`fps=${opts.fps}`);
      }
    }
    if (filters.length > 0) {
      args.push("-vf", filters.join(","));
    }

    // Video codec
    args.push("-c:v", "libx264");
    args.push("-crf", String(opts.crf));
    args.push("-preset", opts.preset);

    // Max bitrate cap
    if (opts.maxBitrate) {
      args.push("-maxrate", opts.maxBitrate);
      // bufsize = 2x maxrate for smooth encoding
      const numVal = parseFloat(opts.maxBitrate);
      const unit = opts.maxBitrate.replace(/[\d.]/g, "") || "M";
      args.push("-bufsize", `${numVal * 2}${unit}`);
    }

    // Audio
    args.push("-c:a", "aac", "-b:a", opts.audioBitrate);

    args.push(outputName);

    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data as BlobPart], { type: "video/mp4" });
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

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".mp4";
}
