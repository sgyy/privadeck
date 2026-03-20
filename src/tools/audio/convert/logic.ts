import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

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
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputExt = getExtension(file.name);
  const inputName = "input" + inputExt;
  const outputName = "output." + format;

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    ...FORMAT_OPTIONS[format],
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new Blob([data as BlobPart], { type: FORMAT_MIME[format] });
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp3";
}
