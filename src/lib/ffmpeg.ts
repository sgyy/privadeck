import type { FFmpeg } from "@ffmpeg/ffmpeg";

const MT_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm";
const ST_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let currentProgressHandler: ((event: { progress: number }) => void) | null = null;
let multiThreaded = false;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const useMT = isSharedArrayBufferSupported();

    async function loadCore(mt: boolean): Promise<FFmpeg> {
      const ffmpeg = new FFmpeg();
      const baseURL = mt ? MT_BASE : ST_BASE;
      const loadConfig: Record<string, string> = {
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      };
      if (mt) {
        loadConfig.workerURL = await toBlobURL(
          `${baseURL}/ffmpeg-core.worker.js`,
          "text/javascript",
        );
      }
      try {
        await ffmpeg.load(loadConfig);
      } catch (e) {
        // Terminate partially-initialized instance to avoid Worker leak
        try { ffmpeg.terminate(); } catch { /* ignore */ }
        throw e;
      }
      return ffmpeg;
    }

    let ffmpeg: FFmpeg;
    if (useMT) {
      try {
        ffmpeg = await loadCore(true);
        multiThreaded = true;
      } catch {
        // MT failed, fall back to single-threaded core
        ffmpeg = await loadCore(false);
        multiThreaded = false;
      }
    } else {
      ffmpeg = await loadCore(false);
      multiThreaded = false;
    }

    ffmpegInstance = ffmpeg;
    loadingPromise = null;
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
      if (progress < 0 || progress > 1) return;
      onProgress(Math.round(progress * 100));
    };
    ffmpegInstance.on("progress", currentProgressHandler);
  }
}

export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

export function getThreadArgs(): string[] {
  return multiThreaded ? ["-threads", "4"] : [];
}
