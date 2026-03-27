import { execWithMount } from "@/lib/ffmpeg";

export type OutputFormat = "mp3" | "wav" | "aac";

const FORMAT_OPTIONS: Record<OutputFormat, { args: string[]; mime: string }> = {
  mp3: { args: ["-acodec", "libmp3lame", "-q:a", "2"], mime: "audio/mpeg" },
  wav: { args: ["-acodec", "pcm_s16le"], mime: "audio/wav" },
  aac: { args: ["-acodec", "aac", "-b:a", "192k"], mime: "audio/aac" },
};

export async function extractAudio(
  file: File,
  format: OutputFormat,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const outputName = "output." + format;

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath,
    "-vn",
    ...FORMAT_OPTIONS[format].args,
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: FORMAT_OPTIONS[format].mime });
}
