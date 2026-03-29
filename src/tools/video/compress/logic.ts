import { execWithMount } from "@/lib/ffmpeg";
import { isWebCodecsSupported, parseBitrate, validateConversion, WebCodecsFallbackError, UnsupportedVideoCodecError, type VideoCodec } from "@/lib/media-pipeline";

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
  /** Output video codec: "avc" (H.264) or "hevc" (H.265). Default is "avc". */
  codec?: VideoCodec;
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

const RESOLUTION_WIDTH: Record<Exclude<ResolutionOption, "original">, number> = {
  "1080p": 1920,
  "720p": 1280,
  "480p": 854,
  "360p": 640,
};

// Map CRF to Mediabunny bitrate (bits/sec) for 1080p. Scaled by resolution.
function crfToBitrate(crf: number, width: number, height: number): number {
  // CRF 0 = lossless (~50Mbps), CRF 51 = worst (~100kbps)
  // Approximate: bitrate = baseBitrate * (51-crf)/51 * (pixels/2073600)
  // Use a more practical mapping based on common CRF values
  const pixelRatio = (width * height) / (1920 * 1080);
  let baseBps: number;
  if (crf <= 18) baseBps = 8_000_000;
  else if (crf <= 23) baseBps = 5_000_000;
  else if (crf <= 28) baseBps = 2_500_000;
  else if (crf <= 33) baseBps = 1_200_000;
  else if (crf <= 38) baseBps = 600_000;
  else if (crf <= 43) baseBps = 300_000;
  else baseBps = 150_000;
  return Math.round(baseBps * Math.max(pixelRatio, 0.1));
}

export async function compressVideo(
  file: File,
  options: Quality | CompressOptions,
  onProgress?: (progress: number) => void,
  sourceHeight?: number,
  sourceFps?: number,
): Promise<Blob> {
  if (isWebCodecsSupported()) {
    try {
      return await compressWithWebCodecs(file, options, onProgress, sourceHeight, sourceFps);
    } catch (e) {
      if (e instanceof WebCodecsFallbackError) {
        // Unsupported video codec detected (e.g., H.265/HEVC, VP9, AV1)
        // Do not fall back to FFmpeg due to poor performance
        if (e.isVideoCodecIssue) {
          throw new UnsupportedVideoCodecError();
        }
        // For other codec issues (e.g., audio), still fall back to FFmpeg
        console.warn("WebCodecs unavailable for this video, falling back to FFmpeg:", e.message);
      } else {
        throw e;
      }
    }
  }
  return compressWithFFmpeg(file, options, onProgress, sourceHeight, sourceFps);
}

async function compressWithWebCodecs(
  file: File,
  options: Quality | CompressOptions,
  onProgress?: (progress: number) => void,
  sourceHeight?: number,
  sourceFps?: number,
): Promise<Blob> {
  const opts: CompressOptions =
    typeof options === "string" ? PRESET_OPTIONS[options] : options;

  const {
    Input, Output, Conversion,
    BlobSource, BufferTarget,
    Mp4OutputFormat, ALL_FORMATS,
  } = await import("mediabunny");

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  });

  // Determine target dimensions
  let targetWidth: number | undefined;
  let targetHeight: number | undefined;
  if (opts.resolution !== "original") {
    const h = RESOLUTION_HEIGHT[opts.resolution];
    if (!sourceHeight || h < sourceHeight) {
      targetWidth = RESOLUTION_WIDTH[opts.resolution];
      targetHeight = h;
    }
  }

  // Determine target frame rate
  let targetFps: number | undefined;
  if (opts.fps !== "original") {
    const fps = Number(opts.fps);
    if (!sourceFps || fps < sourceFps) {
      targetFps = fps;
    }
  }

  // Calculate video bitrate from CRF
  const effectiveWidth = targetWidth ?? 1920;
  const effectiveHeight = targetHeight ?? (sourceHeight || 1080);
  let videoBitrate = crfToBitrate(opts.crf, effectiveWidth, effectiveHeight);

  // Apply maxBitrate cap
  if (opts.maxBitrate) {
    const maxBps = parseBitrate(opts.maxBitrate);
    videoBitrate = Math.min(videoBitrate, maxBps);
  }

  const audioBps = parseBitrate(opts.audioBitrate);

  // Use selected codec or default to "avc"
  const outputCodec = opts.codec ?? "avc";

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: outputCodec,
      bitrate: videoBitrate,
      ...(targetWidth != null && { width: targetWidth }),
      ...(targetHeight != null && { height: targetHeight, fit: "contain" as const }),
      ...(targetFps != null && { frameRate: targetFps }),
      hardwareAcceleration: "prefer-hardware",
    },
    audio: {
      codec: "aac",
      bitrate: audioBps,
    },
    showWarnings: false,
  });

  validateConversion(conversion);

  if (onProgress) {
    conversion.onProgress = (p: number) => {
      onProgress(Math.round(p * 100));
    };
  }

  await conversion.execute();
  if (!target.buffer) throw new Error("Mediabunny produced no output");
  return new Blob([target.buffer], { type: "video/mp4" });
}

async function compressWithFFmpeg(
  file: File,
  options: Quality | CompressOptions,
  onProgress?: (progress: number) => void,
  sourceHeight?: number,
  sourceFps?: number,
): Promise<Blob> {
  const opts: CompressOptions =
    typeof options === "string" ? PRESET_OPTIONS[options] : options;

  const outputName = "compressed_out.mp4";

  const data = await execWithMount(file, (inputPath) => {
    const args: string[] = ["-i", inputPath];

    // Video filters
    const filters: string[] = [];
    if (opts.resolution !== "original") {
      const h = RESOLUTION_HEIGHT[opts.resolution];
      if (!sourceHeight || h < sourceHeight) {
        filters.push(`scale=-2:${h}`);
      }
    }
    if (opts.fps !== "original") {
      const targetFps = Number(opts.fps);
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
      const numVal = parseFloat(opts.maxBitrate);
      const unit = opts.maxBitrate.replace(/[\d.]/g, "") || "M";
      args.push("-bufsize", `${numVal * 2}${unit}`);
    }

    // Audio
    args.push("-c:a", "aac", "-b:a", opts.audioBitrate);

    args.push(outputName);
    return args;
  }, outputName, onProgress);
  return new Blob([data as BlobPart], { type: "video/mp4" });
}
