import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";
import { isWebCodecsSupported, validateConversion, WebCodecsFallbackError } from "@/lib/media-pipeline";

export type ResizePreset = "720p" | "480p" | "360p" | "custom";

const PRESET_MAP: Record<Exclude<ResizePreset, "custom">, { width: number; ffmpegScale: string }> = {
  "720p": { width: 1280, ffmpegScale: "1280:-2" },
  "480p": { width: 854, ffmpegScale: "854:-2" },
  "360p": { width: 640, ffmpegScale: "640:-2" },
};

export async function resizeVideo(
  file: File,
  preset: ResizePreset,
  customWidth?: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (isWebCodecsSupported()) {
    try {
      return await resizeWithWebCodecs(file, preset, customWidth, onProgress);
    } catch (e) {
      if (e instanceof WebCodecsFallbackError) {
        console.warn("WebCodecs unavailable for this video, falling back to FFmpeg:", e.message);
      } else {
        throw e;
      }
    }
  }
  return resizeWithFFmpeg(file, preset, customWidth, onProgress);
}

async function resizeWithWebCodecs(
  file: File,
  preset: ResizePreset,
  customWidth?: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const {
    Input, Output, Conversion,
    BlobSource, BufferTarget,
    Mp4OutputFormat, ALL_FORMATS,
  } = await import("mediabunny");

  const evenWidth = customWidth ? Math.round(customWidth / 2) * 2 : 1280;
  const targetWidth = preset === "custom"
    ? evenWidth
    : PRESET_MAP[preset as Exclude<ResizePreset, "custom">].width;

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
      width: targetWidth,
      fit: "contain",
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
  return new Blob([target.buffer], { type: "video/mp4" });
}

async function resizeWithFFmpeg(
  file: File,
  preset: ResizePreset,
  customWidth?: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const ext = getExtension(file.name);
  const inputName = "input" + ext;
  const outputName = "resized_out.mp4";

  const evenWidth = customWidth ? Math.round(customWidth / 2) * 2 : 1280;
  const scale =
    preset === "custom"
      ? `${evenWidth}:-2`
      : PRESET_MAP[preset as Exclude<ResizePreset, "custom">]?.ffmpegScale || "1280:-2";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale=${scale}`,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      outputName,
    ]);
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
