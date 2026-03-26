import { getFFmpeg } from "@/lib/ffmpeg";

export interface StreamInfo {
  index: number;
  type: "video" | "audio" | "subtitle" | "data";
  codec: string;
  profile?: string;
  pixelFormat?: string;
  resolution?: string;
  fps?: string;
  bitrate?: string;
  sampleRate?: string;
  channels?: string;
  colorSpace?: string;
  scanType?: string;
  raw: string;
}

export interface ProbeResult {
  container?: string;
  duration?: string;
  totalBitrate?: string;
  startTime?: string;
  streams: StreamInfo[];
  rawLog: string[];
}

/**
 * Probe a video file using FFmpeg's log output.
 * Runs `ffmpeg -i input` (which exits non-zero since there's no output),
 * but the log contains full media info similar to ffprobe.
 */
export async function probeVideo(file: File): Promise<ProbeResult> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const ext = file.name.match(/\.[^.]+$/)?.[0] ?? ".mp4";
  const inputName = `probe_input${ext}`;
  const logLines: string[] = [];

  const logHandler = ({ message }: { message: string }) => {
    logLines.push(message);
  };

  ffmpeg.on("log", logHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    // -i without output always exits non-zero; that's expected
    await ffmpeg.exec(["-i", inputName]).catch(() => {});
  } finally {
    ffmpeg.off("log", logHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* ignore */
    }
  }

  return parseFFmpegLog(logLines);
}

/**
 * Parse FFmpeg log output into structured probe result.
 *
 * Expected patterns:
 *   Input #0, matroska,webm, from 'input.mkv':
 *   Duration: 00:10:30.50, start: 0.000000, bitrate: 5432 kb/s
 *   Stream #0:0(eng): Video: h264 (High), yuv420p(tv, bt709, progressive), 1920x1080, 24 fps, ...
 *   Stream #0:1(eng): Audio: aac (LC), 48000 Hz, stereo, fltp, 128 kb/s
 */
export function parseFFmpegLog(lines: string[]): ProbeResult {
  const result: ProbeResult = { streams: [], rawLog: lines };

  for (const line of lines) {
    // Container format: "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':"
    const inputMatch = line.match(/Input #\d+,\s*([^,]+(?:,[^,]+)*),\s*from/);
    if (inputMatch) {
      result.container = inputMatch[1].trim();
    }

    // Duration line: "Duration: 00:10:30.50, start: 0.000000, bitrate: 5432 kb/s"
    const durationMatch = line.match(
      /Duration:\s*([\d:.]+)(?:,\s*start:\s*([\d.]+))?(?:,\s*bitrate:\s*(\d+\s*kb\/s|N\/A))?/,
    );
    if (durationMatch) {
      result.duration = durationMatch[1];
      if (durationMatch[2]) result.startTime = durationMatch[2];
      if (durationMatch[3] && durationMatch[3] !== "N/A") {
        result.totalBitrate = durationMatch[3];
      }
    }

    // Stream lines
    const streamMatch = line.match(
      /Stream #\d+:(\d+)(?:\([^)]*\))?:\s*(Video|Audio|Subtitle|Data):\s*(.*)/,
    );
    if (streamMatch) {
      const streamIndex = parseInt(streamMatch[1], 10);
      const streamType = streamMatch[2].toLowerCase() as StreamInfo["type"];
      const detail = streamMatch[3];

      const stream: StreamInfo = {
        index: streamIndex,
        type: streamType,
        codec: extractCodec(detail),
        raw: detail,
      };

      if (streamType === "video") {
        stream.profile = extractProfile(detail);
        stream.pixelFormat = extractPixelFormat(detail);
        stream.resolution = extractResolution(detail);
        stream.fps = extractFps(detail);
        stream.bitrate = extractBitrate(detail);
        stream.colorSpace = extractColorSpace(detail);
        stream.scanType = extractScanType(detail);
      } else if (streamType === "audio") {
        stream.profile = extractProfile(detail);
        stream.sampleRate = extractSampleRate(detail);
        stream.channels = extractChannels(detail);
        stream.bitrate = extractBitrate(detail);
      }

      result.streams.push(stream);
    }
  }

  return result;
}

/** Extract codec name: "h264 (High)" → "h264", "aac (LC)" → "aac" */
function extractCodec(detail: string): string {
  const match = detail.match(/^(\S+)/);
  return match ? match[1].replace(/,$/, "") : "unknown";
}

/**
 * Extract profile (and level if present):
 *   "h264 (High)" → "High"
 *   "h264 (High 4.1)" → "High 4.1"
 *   "aac (LC)" → "LC"
 */
function extractProfile(detail: string): string | undefined {
  const match = detail.match(/^\S+\s+\(([^)]+)\)/);
  return match ? match[1] : undefined;
}

/** Extract pixel format: "yuv420p" from video stream detail (base name only) */
function extractPixelFormat(detail: string): string | undefined {
  const match = detail.match(/\b(yuv\w+|rgb\w+|bgr\w+|gray\w*|nv\d+)\b/);
  return match ? match[1] : undefined;
}

/** Extract resolution: "1920x1080" from video stream detail */
function extractResolution(detail: string): string | undefined {
  const match = detail.match(/\b(\d{2,5}x\d{2,5})\b/);
  return match ? match[1] : undefined;
}

/** Extract fps: prefer "fps" token, fall back to "tbr" only if plausible (≤300) */
function extractFps(detail: string): string | undefined {
  const fpsMatch = detail.match(/([\d.]+)\s*fps/);
  if (fpsMatch) return fpsMatch[1];
  const tbrMatch = detail.match(/([\d.]+)\s*tbr/);
  if (tbrMatch) {
    const val = parseFloat(tbrMatch[1]);
    if (val > 0 && val <= 300) return tbrMatch[1];
  }
  return undefined;
}

/** Extract bitrate: "128 kb/s" from stream detail */
function extractBitrate(detail: string): string | undefined {
  const match = detail.match(/(\d+)\s*kb\/s/);
  return match ? `${match[1]} kb/s` : undefined;
}

/** Extract sample rate: "48000 Hz" */
function extractSampleRate(detail: string): string | undefined {
  const match = detail.match(/(\d+)\s*Hz/);
  return match ? `${match[1]} Hz` : undefined;
}

/** Extract audio channels: "stereo", "mono", "5.1", etc. */
function extractChannels(detail: string): string | undefined {
  const match = detail.match(/\b(mono|stereo|[0-9]+\.[0-9]+(?:\(side\))?)\b/i);
  return match ? match[1] : undefined;
}

/**
 * Extract color space from pixel format parenthesized info:
 *   "yuv420p(tv, bt709, progressive)" → "bt709"
 *   "yuv420p10le(tv, bt2020nc/bt2020/smpte2084)" → "bt2020nc/bt2020/smpte2084"
 */
function extractColorSpace(detail: string): string | undefined {
  // Look for common color space identifiers in parenthesized pixel format info
  const match = detail.match(
    /\b(?:yuv|rgb|bgr|gray|nv)\w*\([^)]*\b(bt709|bt2020(?:nc)?|smpte170m|smpte240m|bt470bg|bt2020nc\/bt2020\/smpte2084|bt709\/bt709\/bt709)\b/i,
  );
  return match ? match[1] : undefined;
}

/**
 * Extract scan type from pixel format parenthesized info:
 *   "yuv420p(tv, bt709, progressive)" → "progressive"
 *   "yuv420p(tv, bt709)" → undefined (interlaced flagged differently)
 */
function extractScanType(detail: string): string | undefined {
  const match = detail.match(
    /\b(?:yuv|rgb|bgr|gray|nv)\w*\([^)]*\b(progressive|interlaced|top.first|bottom.first)\b/i,
  );
  return match ? match[1] : undefined;
}

/**
 * Generate thumbnail URLs from a video file at specified percentage points.
 * Uses browser's <video> + <canvas> API (no FFmpeg needed).
 */
export async function generateThumbnails(
  file: File,
  percentages: number[] = [10, 30, 50, 70, 90],
): Promise<{ time: number; dataUrl: string }[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  const duration = video.duration;
  if (!duration || !isFinite(duration)) {
    URL.revokeObjectURL(url);
    return [];
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const results: { time: number; dataUrl: string }[] = [];

  for (const pct of percentages) {
    const time = (pct / 100) * duration;
    video.currentTime = time;

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    results.push({ time, dataUrl: canvas.toDataURL("image/jpeg", 0.8) });
  }

  URL.revokeObjectURL(url);
  return results;
}
