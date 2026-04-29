import { execWithMount } from "@/lib/ffmpeg";

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".aac": "audio/aac",
  ".opus": "audio/opus",
  ".weba": "audio/webm",
  ".webm": "audio/webm",
};

/** Stream-copy trim — preserves the original encoder, bitrate, and metadata. */
export async function trimAudio(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const ext = getExtension(file.name);
  const outputName = "trimmed_out" + ext;

  const data = await execWithMount(file, (inputPath) => [
    "-ss", formatTime(startTime),
    "-i", inputPath,
    "-t", formatTime(endTime - startTime),
    "-c", "copy",
    "-map_metadata", "0",
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: outputMime(ext, file.type) });
}

/**
 * Remove the [start,end] segment from the input and concatenate the surrounding
 * parts. Re-encodes to MP3 (libmp3lame -q:a 2) because concat filter requires
 * a re-encode and MP3 has the broadest container compatibility in ffmpeg.wasm.
 *
 * Boundary cases — atrim with a zero-length range produces an empty segment
 * which would crash concat with "Input link has no data". So we degrade to a
 * single-segment trim when the selection touches either end of the file.
 */
export async function trimAudioRemove(
  file: File,
  startTime: number,
  endTime: number,
  totalDuration: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const outputName = "trimmed_remove.mp3";
  const EPS = 0.001;
  const hasHead = startTime > EPS;
  const hasTail = endTime < totalDuration - EPS;

  let filter: string;
  if (hasHead && hasTail) {
    filter =
      `[0:a]atrim=0:${startTime.toFixed(3)},asetpts=PTS-STARTPTS[a];` +
      `[0:a]atrim=start=${endTime.toFixed(3)},asetpts=PTS-STARTPTS[b];` +
      `[a][b]concat=n=2:v=0:a=1[out]`;
  } else if (hasHead) {
    filter = `[0:a]atrim=0:${startTime.toFixed(3)},asetpts=PTS-STARTPTS[out]`;
  } else if (hasTail) {
    filter = `[0:a]atrim=start=${endTime.toFixed(3)},asetpts=PTS-STARTPTS[out]`;
  } else {
    throw new Error("Selection covers the entire audio — nothing left after Remove.");
  }

  const data = await execWithMount(file, (inputPath) => [
    "-i", inputPath,
    "-filter_complex", filter,
    "-map", "[out]",
    "-c:a", "libmp3lame",
    "-q:a", "2",
    "-map_metadata", "0",
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: "audio/mpeg" });
}

/**
 * Trim and apply optional fade-in / fade-out. Re-encodes to MP3.
 * fadeIn and fadeOut are in seconds and clamped to the trimmed duration.
 */
export async function trimAudioWithFade(
  file: File,
  startTime: number,
  endTime: number,
  fadeIn: number,
  fadeOut: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const outputName = "trimmed_fade.mp3";
  const dur = Math.max(0, endTime - startTime);
  const fIn = Math.max(0, Math.min(fadeIn, dur));
  // Cap fOut so fadeIn + fadeOut <= dur — otherwise the two afade filters
  // overlap on the timeline and FFmpeg applies both gains multiplicatively,
  // producing a dip in the middle instead of a clean crossfade.
  const fOut = Math.max(0, Math.min(fadeOut, dur - fIn));
  const fadeOutStart = Math.max(0, dur - fOut);

  const filterParts: string[] = [];
  if (fIn > 0) filterParts.push(`afade=t=in:st=0:d=${fIn.toFixed(3)}`);
  if (fOut > 0) filterParts.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fOut.toFixed(3)}`);
  const af = filterParts.length > 0 ? filterParts.join(",") : "anull";

  const data = await execWithMount(file, (inputPath) => [
    "-ss", formatTime(startTime),
    "-i", inputPath,
    "-t", formatTime(dur),
    "-af", af,
    "-c:a", "libmp3lame",
    "-q:a", "2",
    "-map_metadata", "0",
    outputName,
  ], outputName, onProgress);
  return new Blob([data as BlobPart], { type: "audio/mpeg" });
}

export function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  // Round to whole milliseconds first, then carry — `Math.round((safe%1)*1000)`
  // can yield 1000 (e.g. safe=5.9995 → ".1000"), and FFmpeg parses the trailing
  // ".1000" as fractional 0.1s, shifting the seek point ~0.9s backward.
  const totalMs = Math.round(safe * 1000);
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export function formatTimeDisplay(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** mm:ss.mmm — used for precise input boxes. */
export function formatTimePrecise(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  // Round to whole milliseconds first so display matches what the FFmpeg
  // command would actually receive (toFixed(3)). Carry over to seconds /
  // minutes when ms rounds up to 1000 instead of clamping to 999, which
  // would silently shift values backward by 1 ms.
  const totalMs = Math.round(safe * 1000);
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

/**
 * Parse a time string into seconds.
 *
 * Accepted formats:
 *   - "m:ss.mmm" (e.g. "1:23.456")
 *   - "m:ss" (e.g. "1:23")
 *   - "ss.mmm" (e.g. "23.456")
 *   - "ss" (e.g. "23")
 *
 * Returns null on invalid input.
 */
export function parseTimeString(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const re = /^(?:(\d{1,3}):)?(\d{1,2})(?:\.(\d{1,3}))?$/;
  const m = trimmed.match(re);
  if (!m) return null;
  const minutes = m[1] ? Number(m[1]) : 0;
  const seconds = Number(m[2]);
  if (m[1] !== undefined && seconds >= 60) return null;
  const msStr = m[3] ?? "";
  const msPadded = (msStr + "000").slice(0, 3);
  const ms = msStr ? Number(msPadded) : 0;
  return minutes * 60 + seconds + ms / 1000;
}

function outputMime(ext: string, fallback: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] ?? fallback ?? "audio/mpeg";
}

function getExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/);
  return ext ? ext[0] : ".mp3";
}
