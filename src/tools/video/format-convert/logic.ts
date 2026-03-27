import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";
import { isWebCodecsSupported, validateConversion, WebCodecsFallbackError } from "@/lib/media-pipeline";

export type VideoFormat = "mp4" | "mkv" | "avi";

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
): Promise<{ blob: Blob; filename: string }> {
  // Use WebCodecs for MP4 and MKV; fall back to FFmpeg for AVI
  if (isWebCodecsSupported() && WEBCODECS_FORMATS.includes(format)) {
    try {
      return await convertWithWebCodecs(file, format, onProgress);
    } catch (e) {
      if (e instanceof WebCodecsFallbackError) {
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

  // MKV: stream copy (no transcoding). MP4: transcode to H.264+AAC.
  const needsTranscode = format !== "mkv";

  const conversion = await Conversion.init({
    input,
    output,
    video: needsTranscode
      ? { codec: "avc", hardwareAcceleration: "prefer-hardware" }
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
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const config = FORMAT_CONFIG[format];
  const outputName = "output" + config.ext;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(["-i", inputName, ...config.args, outputName]);
    const data = await ffmpeg.readFile(outputName);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
      blob: new Blob([data as BlobPart], { type: config.mime }),
      filename: baseName + config.ext,
    };
  } finally {
    setProgressHandler(null);
    try { await ffmpeg.deleteFile(inputName); } catch { /* ignore */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }
  }
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".mp4";
}
