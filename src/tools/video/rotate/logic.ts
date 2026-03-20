import { getFFmpeg, setProgressHandler } from "@/lib/ffmpeg";

export type RotateAngle = 90 | 180 | 270;

const TRANSPOSE_MAP: Record<RotateAngle, string[]> = {
  90: ["-vf", "transpose=1"],
  180: ["-vf", "transpose=1,transpose=1"],
  270: ["-vf", "transpose=2"],
};

export async function rotateVideo(
  file: File,
  angle: RotateAngle,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  setProgressHandler(onProgress ?? null);
  const inputName = "input" + getExtension(file.name);
  const outputName = "output" + getExtension(file.name);

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    ...TRANSPOSE_MAP[angle],
    "-c:a", "copy",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new Blob([data as BlobPart], { type: file.type || "video/mp4" });
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp4";
}
