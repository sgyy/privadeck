import { execWithMount } from "@/lib/ffmpeg";

export type AudioFormat = "mp3" | "wav" | "ogg" | "aac" | "flac";

const FORMAT_OPTIONS: Record<AudioFormat, string[]> = {
  mp3: ["-acodec", "libmp3lame", "-q:a", "2"],
  wav: ["-acodec", "pcm_s16le"],
  ogg: ["-acodec", "libvorbis", "-q:a", "5"],
  aac: ["-acodec", "aac", "-b:a", "192k"],
  flac: ["-acodec", "flac"],
};

const FORMAT_MIME: Record<AudioFormat, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  flac: "audio/flac",
};

export async function convertAudio(
  file: File,
  format: AudioFormat,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const outputName = "output." + format;

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath,
    ...FORMAT_OPTIONS[format],
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: FORMAT_MIME[format] });
}
