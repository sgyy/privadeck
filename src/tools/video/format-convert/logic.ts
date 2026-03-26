import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export type VideoFormat = "mp4" | "mkv" | "avi";

const FORMAT_CONFIG: Record<
  VideoFormat,
  { ext: string; mime: string; args: string[] }
> = {
  mp4: {
    ext: ".mp4",
    mime: "video/mp4",
    args: ["-c:v", "libx264", "-c:a", "aac"],
  },
  mkv: {
    ext: ".mkv",
    mime: "video/x-matroska",
    args: ["-c:v", "copy", "-c:a", "copy"],
  },
  avi: {
    ext: ".avi",
    mime: "video/x-msvideo",
    args: ["-c:v", "libx264", "-c:a", "aac"],
  },
};

export const FORMATS: VideoFormat[] = ["mp4", "mkv", "avi"];

export async function convertVideoFormat(
  file: File,
  format: VideoFormat,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const config = FORMAT_CONFIG[format];
  const outputName = "output" + config.ext;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(["-i", inputName, ...config.args, outputName]);
    const data = await ffmpeg.readFile(outputName);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
      blob: new Blob([data as BlobPart], { type: config.mime }),
      filename: baseName + config.ext,
    };
  } finally {
    setProgressHandler(null);
    try { await ffmpeg.deleteFile(inputName); } catch { /* ignore */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }
  }
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".mp4";
}
