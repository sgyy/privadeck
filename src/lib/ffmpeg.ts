import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let currentProgressHandler: ((event: { progress: number }) => void) | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })().catch((e) => {
    loadingPromise = null;
    throw e;
  });

  return loadingPromise;
}

export function setProgressHandler(
  onProgress: ((progress: number) => void) | null,
): void {
  if (!ffmpegInstance) return;

  if (currentProgressHandler) {
    ffmpegInstance.off("progress", currentProgressHandler);
    currentProgressHandler = null;
  }

  if (onProgress) {
    currentProgressHandler = ({ progress }) => {
      onProgress(Math.round(progress * 100));
    };
    ffmpegInstance.on("progress", currentProgressHandler);
  }
}

export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}
