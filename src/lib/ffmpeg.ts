import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let currentProgressHandler: ((event: { progress: number }) => void) | null = null;

// Promise queue to serialize all FFmpeg operations (FFmpeg WASM is single-threaded)
let execQueue: Promise<unknown> = Promise.resolve();

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();

    // Use UMD core to avoid ESM dynamic import issues in worker context
    // toBlobURL converts to blob URLs which work reliably across all browsers
    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
    } catch (e) {
      try { ffmpeg.terminate(); } catch { /* ignore */ }
      throw e;
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

function setProgressHandler(
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

/** Extract file extension, defaulting to ".mp4" */
function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".mp4";
}

/**
 * Enqueue an arbitrary operation onto the FFmpeg serialization queue.
 * Use this for operations that need direct FFmpeg access (e.g. probe with log listeners)
 * while still respecting the single-threaded execution constraint.
 */
export function enqueueOperation<T>(fn: (ffmpeg: FFmpeg) => Promise<T>): Promise<T> {
  const task = execQueue.then(async () => {
    const ffmpeg = await getFFmpeg();
    return fn(ffmpeg);
  });
  execQueue = task.catch(() => {});
  return task;
}

/**
 * Execute FFmpeg with WORKERFS-mounted input file to avoid memory copies.
 * Instead of fetchFile() + writeFile() which creates 2 full copies in memory,
 * WORKERFS mounts the File object directly — FFmpeg reads from disk on demand.
 *
 * Operations are serialized via a promise queue to prevent concurrent mount
 * point collisions (FFmpeg WASM is single-threaded anyway).
 * Progress handler is set/cleared atomically inside the queue.
 *
 * @param file - Input File to mount (read-only via WORKERFS)
 * @param buildArgs - Function receiving the mounted input path, returns FFmpeg args
 * @param outputName - Output filename in MEMFS (caller defines the name)
 * @param onProgress - Optional progress callback (0-100)
 * @returns The output file data as Uint8Array
 */
export function execWithMount(
  file: File,
  buildArgs: (inputPath: string) => string[],
  outputName: string,
  onProgress?: (progress: number) => void,
): Promise<Uint8Array> {
  return enqueueOperation(async (ffmpeg) => {
    const mountPoint = "/input";
    const safeInputName = `input${getExtension(file.name)}`;

    setProgressHandler(onProgress ?? null);

    try {
      await ffmpeg.createDir(mountPoint);
    } catch {
      /* directory may already exist */
    }

    // Use WORKERFS blobs option with a safe alias name to avoid issues with
    // spaces, special characters, or Unicode in file.name.
    // blobs option accepts {name, data} entries — no File copy needed.
    const { FFFSType } = await import("@ffmpeg/ffmpeg");
    await ffmpeg.mount(
      FFFSType.WORKERFS,
      { blobs: [{ name: safeInputName, data: file }] },
      mountPoint,
    );
    try {
      const inputPath = `${mountPoint}/${safeInputName}`;
      await ffmpeg.exec(buildArgs(inputPath));
      const data = await ffmpeg.readFile(outputName);
      // Free MEMFS copy immediately after read to reduce peak memory
      try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }
      return data as Uint8Array;
    } finally {
      setProgressHandler(null);
      try {
        await ffmpeg.unmount(mountPoint);
        await ffmpeg.deleteDir(mountPoint);
      } catch {
        /* ignore */
      }
    }
  });
}
