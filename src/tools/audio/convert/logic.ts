import { execWithMount } from "@/lib/ffmpeg";

export type AudioFormat =
  | "mp3"
  | "wav"
  | "ogg"
  | "aac"
  | "flac"
  | "m4a"
  | "opus";

export interface ConvertOptions {
  /** Bitrate in kbps. Ignored for lossless formats (wav, flac). */
  bitrate?: number;
  /** Sample rate in Hz. Omit to keep source rate. */
  sampleRate?: number;
  /** 1 = mono, 2 = stereo. Omit to keep source channel layout. */
  channels?: 1 | 2;
}

interface FormatMeta {
  ext: string;
  mime: string;
  codec: string;
  /** Lossless PCM/FLAC — bitrate flag is meaningless and rejected by FFmpeg. */
  lossless: boolean;
  /** Force a specific muxer when the extension alone is ambiguous. */
  muxer?: string;
}

const FORMAT_META: Record<AudioFormat, FormatMeta> = {
  mp3: { ext: "mp3", mime: "audio/mpeg", codec: "libmp3lame", lossless: false },
  wav: { ext: "wav", mime: "audio/wav", codec: "pcm_s16le", lossless: true },
  ogg: { ext: "ogg", mime: "audio/ogg", codec: "libvorbis", lossless: false },
  aac: { ext: "aac", mime: "audio/aac", codec: "aac", lossless: false, muxer: "adts" },
  flac: { ext: "flac", mime: "audio/flac", codec: "flac", lossless: true },
  // m4a is AAC inside an MP4/ISO container; "ipod" muxer is the iTunes-friendly
  // MP4 variant and avoids ambiguity with raw ADTS .aac.
  m4a: { ext: "m4a", mime: "audio/mp4", codec: "aac", lossless: false, muxer: "ipod" },
  // .opus is Ogg-container Opus. libopus tops out at 256 kbps.
  opus: { ext: "opus", mime: "audio/opus", codec: "libopus", lossless: false },
};

export const FORMATS: AudioFormat[] = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "opus"];
export const LOSSY_FORMATS: AudioFormat[] = ["mp3", "ogg", "aac", "m4a", "opus"];
export const STANDARD_BITRATES = [64, 96, 128, 160, 192, 256, 320] as const;
/** libopus rejects > 256 kbps with "Bitrate too high"; cap before passing. */
export const OPUS_BITRATES = [32, 64, 96, 128, 160, 192, 256] as const;
export const SAMPLE_RATES = [8000, 16000, 22050, 32000, 44100, 48000] as const;

export function isLossless(format: AudioFormat): boolean {
  return FORMAT_META[format].lossless;
}

export function getMime(format: AudioFormat): string {
  return FORMAT_META[format].mime;
}

export function getExtension(format: AudioFormat): string {
  return FORMAT_META[format].ext;
}

export function getBitrateOptions(format: AudioFormat): readonly number[] {
  return format === "opus" ? OPUS_BITRATES : STANDARD_BITRATES;
}

function buildArgs(
  inputPath: string,
  outputName: string,
  format: AudioFormat,
  options: ConvertOptions,
): string[] {
  const meta = FORMAT_META[format];
  const args: string[] = ["-i", inputPath, "-c:a", meta.codec];

  if (!meta.lossless && options.bitrate) {
    const cap = format === "opus" ? 256 : 320;
    const b = Math.max(8, Math.min(cap, options.bitrate));
    args.push("-b:a", `${b}k`);
  }
  if (options.sampleRate && options.sampleRate > 0) {
    args.push("-ar", String(options.sampleRate));
  }
  if (options.channels === 1 || options.channels === 2) {
    args.push("-ac", String(options.channels));
  }
  if (meta.muxer) {
    args.push("-f", meta.muxer);
  }
  // `-map_metadata 0` carries ID3 / container tags from input. Containers that
  // can't represent a given tag (e.g. PCM wav) silently drop it — FFmpeg
  // doesn't fail.
  args.push("-map_metadata", "0", outputName);
  return args;
}

export async function convertAudio(
  file: File,
  format: AudioFormat,
  onProgress?: (progress: number) => void,
  options: ConvertOptions = {},
): Promise<Blob> {
  const meta = FORMAT_META[format];
  const outputName = `output.${meta.ext}`;

  const data = await execWithMount(
    file,
    (inputPath) => buildArgs(inputPath, outputName, format, options),
    outputName,
    onProgress,
  );
  return new Blob([data as BlobPart], { type: meta.mime });
}
