import { execWithMount } from "@/lib/ffmpeg";
import { isWebCodecsSupported, validateConversion, WebCodecsFallbackError } from "@/lib/media-pipeline";

export type RotateAngle = 90 | 180 | 270;

const TRANSPOSE_MAP: Record<RotateAngle, string[]> = {
  90: ["-vf", "transpose=1"],
  180: ["-vf", "transpose=1,transpose=1"],
  270: ["-vf", "transpose=2"],
};

export async function rotateVideo(
  file: File,
  angle: RotateAngle,
  onProgress?: (progress: number) => void,
  onFallback?: (isVideoCodecIssue: boolean) => void,
): Promise<Blob> {
  if (isWebCodecsSupported()) {
    try {
      return await rotateWithWebCodecs(file, angle, onProgress);
    } catch (e) {
      if (e instanceof WebCodecsFallbackError) {
        console.warn("WebCodecs unavailable for this video, falling back to FFmpeg:", e.message);
        onFallback?.(e.isVideoCodecIssue);
      } else {
        throw e;
      }
    }
  }
  return rotateWithFFmpeg(file, angle, onProgress);
}

async function rotateWithWebCodecs(
  file: File,
  angle: RotateAngle,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
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

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: "avc",
      rotate: angle,
      allowRotationMetadata: false,
      hardwareAcceleration: "prefer-hardware",
    },
    audio: {
      codec: "aac",
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
  return new Blob([target.buffer], { type: file.type || "video/mp4" });
}

async function rotateWithFFmpeg(
  file: File,
  angle: RotateAngle,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const outputName = "rotated_out.mp4";

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath,
    ...TRANSPOSE_MAP[angle],
    "-c:a", "copy",
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: file.type || "video/mp4" });
}
