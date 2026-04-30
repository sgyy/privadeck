import { execWithMount } from "@/lib/ffmpeg";
import {
  type AudioFormat,
  type ConvertOptions,
  FORMATS,
  STANDARD_BITRATES,
  OPUS_BITRATES,
  SAMPLE_RATES,
  isLossless,
  getMime,
  getExtension,
  getCodec,
  getMuxer,
  getBitrateOptions,
  clampBitrate,
} from "../convert/logic";
import { formatTime } from "../trim/logic";

// Re-export so AudioExtract.tsx imports purely from "./logic" and remains
// unaware of the cross-tool boundary. Lets us swap implementations later
// without touching the UI layer.
export {
  type AudioFormat,
  type ConvertOptions,
  FORMATS,
  STANDARD_BITRATES,
  OPUS_BITRATES,
  SAMPLE_RATES,
  isLossless,
  getMime,
  getExtension,
  getBitrateOptions,
};

export interface ExtractOptions extends ConvertOptions {
  /** Inclusive start time in seconds. Omit for whole-file extraction. */
  start?: number;
  /** Exclusive end time in seconds. Omit for whole-file extraction. */
  end?: number;
  /** Fade-in duration in seconds, applied to the trimmed output. */
  fadeIn?: number;
  /** Fade-out duration in seconds, applied to the trimmed output. */
  fadeOut?: number;
  /** Total source duration. Required when fadeOut > 0 without an explicit
   *  time range, so the filter knows where the tail ends. */
  duration?: number;
}

function buildArgs(
  inputPath: string,
  outputName: string,
  format: AudioFormat,
  opts: ExtractOptions,
): string[] {
  const lossless = isLossless(format);
  const codec = getCodec(format);
  const muxer = getMuxer(format);

  const hasRange =
    typeof opts.start === "number" &&
    typeof opts.end === "number" &&
    opts.end > opts.start;
  const segDuration = hasRange
    ? (opts.end as number) - (opts.start as number)
    : opts.duration ?? null;

  const args: string[] = [];

  // Pre-input -ss is fast-seek (keyframe-snapped on video, but we drop video
  // with -vn anyway); paired with post-input -t for sample-accurate length on
  // re-encode. Standard FFmpeg pattern for accurate cuts that don't decode
  // from t=0.
  if (hasRange) args.push("-ss", formatTime(opts.start as number));
  args.push("-i", inputPath, "-vn");
  if (hasRange) args.push("-t", formatTime(segDuration as number));

  args.push("-c:a", codec);

  if (!lossless && opts.bitrate) {
    args.push("-b:a", `${clampBitrate(format, opts.bitrate)}k`);
  }
  if (opts.sampleRate && opts.sampleRate > 0) {
    args.push("-ar", String(opts.sampleRate));
  }
  if (opts.channels === 1 || opts.channels === 2) {
    args.push("-ac", String(opts.channels));
  }

  // afade `st` is relative to the post-trim output (st=0 means "0s into the
  // exported clip"), so we don't offset by opts.start. fadeIn doesn't need
  // segment duration; fadeOut does, because `fadeOutStart = dur - fOut`. Cap
  // fadeOut so fadeIn + fadeOut <= dur — overlapping afade filters multiply
  // their gains and dip the middle instead of crossfading.
  const dur = segDuration;
  const filters: string[] = [];
  if (opts.fadeIn && opts.fadeIn > 0) {
    const fIn = dur && dur > 0 ? Math.min(opts.fadeIn, dur) : opts.fadeIn;
    if (fIn > 0) filters.push(`afade=t=in:st=0:d=${fIn.toFixed(3)}`);
  }
  if (opts.fadeOut && opts.fadeOut > 0 && dur && dur > 0) {
    const fInClamp = Math.max(0, Math.min(opts.fadeIn ?? 0, dur));
    const fOut = Math.max(0, Math.min(opts.fadeOut, dur - fInClamp));
    if (fOut > 0) {
      const fadeOutStart = Math.max(0, dur - fOut);
      filters.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fOut.toFixed(3)}`);
    }
  }
  if (filters.length > 0) args.push("-af", filters.join(","));

  if (muxer) args.push("-f", muxer);
  args.push("-map_metadata", "0", outputName);
  return args;
}

export async function extractAudio(
  file: File,
  format: AudioFormat,
  options: ExtractOptions = {},
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ext = getExtension(format);
  const outputName = `output.${ext}`;
  const data = await execWithMount(
    file,
    (inputPath) => buildArgs(inputPath, outputName, format, options),
    outputName,
    onProgress,
  );
  return new Blob([data as BlobPart], { type: getMime(format) });
}
