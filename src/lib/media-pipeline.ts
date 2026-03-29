/**
 * WebCodecs-based media pipeline using Mediabunny.
 * Provides hardware-accelerated video/audio processing as an alternative to FFmpeg.wasm.
 * Falls back to FFmpeg for unsupported browsers or operations.
 */

export function isWebCodecsSupported(): boolean {
  return (
    typeof globalThis.VideoEncoder !== "undefined" &&
    typeof globalThis.VideoDecoder !== "undefined" &&
    typeof globalThis.AudioEncoder !== "undefined" &&
    typeof globalThis.AudioDecoder !== "undefined"
  );
}

export type ConversionProgress = (progress: number) => void;

/**
 * Parse bitrate string like "192k", "1.5M" to bits per second.
 */
export function parseBitrate(value: string): number {
  const num = parseFloat(value);
  if (value.toLowerCase().endsWith("m")) return num * 1_000_000;
  if (value.toLowerCase().endsWith("k")) return num * 1_000;
  return num;
}

/**
 * Error thrown when WebCodecs cannot handle the source video,
 * signaling that the caller should fall back to FFmpeg.
 */
export class WebCodecsFallbackError extends Error {
  /** True when a video track was discarded due to an undecodable codec (e.g., HEVC, VP9, AV1) */
  readonly isVideoCodecIssue: boolean;

  constructor(reason: string, isVideoCodecIssue = false) {
    super(reason);
    this.name = "WebCodecsFallbackError";
    this.isVideoCodecIssue = isVideoCodecIssue;
  }
}

/**
 * Error thrown when a video uses an unsupported codec (e.g. H.265/HEVC, VP9, AV1)
 * that the browser cannot decode via WebCodecs.
 * This is a terminal error - we no longer fall back to FFmpeg due to poor performance.
 */
export class UnsupportedVideoCodecError extends Error {
  constructor() {
    super("Video codec is not supported by this browser");
    this.name = "UnsupportedVideoCodecError";
  }
}

/**
 * Validate that a Mediabunny Conversion has not discarded any critical tracks.
 * Throws WebCodecsFallbackError if any track was discarded due to codec issues.
 */
export function validateConversion(conversion: {
  isValid: boolean;
  discardedTracks: ReadonlyArray<{
    track: { type: string };
    reason: string;
  }>;
}): void {
  // Check ALL tracks (video AND audio) for codec-related discard reasons.
  // Without this, an unsupported audio codec would silently produce muted output.
  const codecReasons = new Set([
    "undecodable_source_codec",
    "unknown_source_codec",
    "no_encodable_target_codec",
  ]);
  const discardedCodecTracks = conversion.discardedTracks.filter((d) =>
    codecReasons.has(d.reason),
  );
  if (discardedCodecTracks.length > 0) {
    const hasVideoCodecIssue = discardedCodecTracks.some(
      (d) =>
        d.track.type === "video" &&
        d.reason === "undecodable_source_codec",
    );
    const first = discardedCodecTracks[0];
    throw new WebCodecsFallbackError(
      `${first.track.type} track discarded: ${first.reason}`,
      hasVideoCodecIssue,
    );
  }
  if (!conversion.isValid) {
    throw new WebCodecsFallbackError("Conversion is not valid");
  }
}

/**
 * Detect if the user could benefit from installing the HEVC Video Extensions
 * on Windows to enable hardware-accelerated H.265 decoding via WebCodecs.
 * Returns true on Windows + Chromium browsers where HEVC extensions may not be installed.
 */
export function shouldSuggestHevcExtension(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isWindows = ua.includes("Windows");
  const isChromium = ua.includes("Chrome") || ua.includes("Edg");
  return isWindows && isChromium && isWebCodecsSupported();
}
