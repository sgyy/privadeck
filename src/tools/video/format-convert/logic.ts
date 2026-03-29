import { execWithMount } from "@/lib/ffmpeg";
import { isWebCodecsSupported, validateConversion, WebCodecsFallbackError, UnsupportedVideoCodecError, type VideoCodec } from "@/lib/media-pipeline";

export type VideoFormat = "mp4" | "mkv" | "avi";

export interface ConvertOptions {
  codec?: VideoCodec;
  /** Source video codec - used to determine if stream copy is possible for MKV */
  sourceCodec?: VideoCodec;
}

const FORMAT_CONFIG: Record<
  VideoFormat,
  { ext: string; mime: string; args: string[] }
> = {
  mp4: {
    ext: ".mp4",
    mime: "video/mp4",
    args: ["-c:v", "libx264", "-c:a", "aac"],
  },
  mkv: {
    ext: ".mkv",
    mime: "video/x-matroska",
    args: ["-c:v", "copy", "-c:a", "copy"],
  },
  avi: {
    ext: ".avi",
    mime: "video/x-msvideo",
    args: ["-c:v", "libx264", "-c:a", "aac"],
  },
};

// Formats supported by WebCodecs (Mediabunny)
const WEBCODECS_FORMATS: VideoFormat[] = ["mp4", "mkv"];

export const FORMATS: VideoFormat[] = ["mp4", "mkv", "avi"];

export async function convertVideoFormat(
  file: File,
  format: VideoFormat,
  onProgress?: (progress: number) => void,
  options?: ConvertOptions,
): Promise<{ blob: Blob; filename: string }> {
  // Use WebCodecs for MP4 and MKV; fall back to FFmpeg for AVI
  if (isWebCodecsSupported() && WEBCODECS_FORMATS.includes(format)) {
    try {
      return await convertWithWebCodecs(file, format, onProgress, options?.codec, options?.sourceCodec);
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
  return convertWithFFmpeg(file, format, onProgress);
}

async function convertWithWebCodecs(
  file: File,
  format: VideoFormat,
  onProgress?: (progress: number) => void,
  codec: VideoCodec = "avc",
  sourceCodec?: VideoCodec,
): Promise<{ blob: Blob; filename: string }> {
  const {
    Input, Output, Conversion,
    BlobSource, BufferTarget,
    Mp4OutputFormat, MkvOutputFormat,
    ALL_FORMATS,
  } = await import("mediabunny");

  const config = FORMAT_CONFIG[format];

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const outputFormat = format === "mkv"
    ? new MkvOutputFormat()
    : new Mp4OutputFormat();

  const target = new BufferTarget();
  const output = new Output({ format: outputFormat, target });

  // Determine if transcoding is needed:
  // - MP4/AVI: always transcode (container format requires it)
  // - MKV: stream copy if codec matches source, otherwise transcode
  let needsTranscode: boolean;
  if (format === "mkv") {
    // For MKV, only transcode if the target codec differs from source
    needsTranscode = sourceCodec !== codec;
  } else {
    // MP4/AVI always need transcoding
    needsTranscode = true;
  }

  const conversion = await Conversion.init({
    input,
    output,
    video: needsTranscode
      ? { codec, hardwareAcceleration: "prefer-hardware" }
      : undefined,
    audio: needsTranscode
      ? { codec: "aac" }
      : undefined,
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
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return {
    blob: new Blob([target.buffer], { type: config.mime }),
    filename: baseName + config.ext,
  };
}

async function convertWithFFmpeg(
  file: File,
  format: VideoFormat,
  onProgress?: (progress: number) => void,
): Promise<{ blob: Blob; filename: string }> {
  const config = FORMAT_CONFIG[format];
  const outputName = "output" + config.ext;

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath, ...config.args, outputName,
  ], outputName, onProgress);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return {
    blob: new Blob([data as BlobPart], { type: config.mime }),
    filename: baseName + config.ext,
  };
}
