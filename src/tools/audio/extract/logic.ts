import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

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
  const ffmpeg = await getFFmpeg();
  setProgressHandler(onProgress ?? null);
  const inputExt = getExtension(file.name);
  const inputName = "input" + inputExt;
  const outputName = "output." + format;

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vn",
    ...FORMAT_OPTIONS[format].args,
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new Blob([data as BlobPart], { type: FORMAT_OPTIONS[format].mime });
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp4";
}
