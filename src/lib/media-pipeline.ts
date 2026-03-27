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
  constructor(reason: string) {
    super(reason);
    this.name = "WebCodecsFallbackError";
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
  const discarded = conversion.discardedTracks.find((d) =>
    codecReasons.has(d.reason),
  );
  if (discarded) {
    throw new WebCodecsFallbackError(
      `${discarded.track.type} track discarded: ${discarded.reason}`,
    );
  }
  if (!conversion.isValid) {
    throw new WebCodecsFallbackError("Conversion is not valid");
  }
}
