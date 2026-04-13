import { isWebCodecsSupported, UnsupportedVideoCodecError } from "@/lib/media-pipeline";

export type RotateAngle = 90 | 180 | 270;

/**
 * Rotate video using mediabunny (WebCodecs-based).
 * Only supports rotation (90/180/270), not flip.
 * Requires WebCodecs API support in browser.
 */
export async function rotateVideo(
  file: File,
  angle: RotateAngle,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (!isWebCodecsSupported()) {
    throw new Error("WebCodecs is not supported in this browser");
  }

  return rotateWithMediabunny(file, angle, onProgress);
}

/**
 * Transform video rotation using mediabunny's WebCodecs-based pipeline.
 * Hardware-accelerated and runs entirely in the browser.
 */
async function rotateWithMediabunny(
  file: File,
  angle: RotateAngle,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const {
    Input, Output, Conversion,
    BlobSource, BufferTarget,
    Mp4OutputFormat, ALL_FORMATS,
  } = await import("mediabunny");

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  });

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: "avc",
      rotate: angle,
      allowRotationMetadata: false,
      hardwareAcceleration: "prefer-hardware",
    },
    audio: {
      codec: "aac",
    },
    showWarnings: false,
  });

  // Validate conversion tracks
  const codecReasons = new Set([
    "undecodable_source_codec",
    "unknown_source_codec",
    "no_encodable_target_codec",
  ]);

  const discardedCodecTracks = conversion.discardedTracks?.filter((d: { reason: string }) =>
    codecReasons.has(d.reason),
  ) || [];

  if (discardedCodecTracks.length > 0) {
    const hasVideoCodecIssue = discardedCodecTracks.some(
      (d: { track: { type: string }; reason: string }) => d.track.type === "video" && d.reason === "undecodable_source_codec",
    );

    if (hasVideoCodecIssue) {
      throw new UnsupportedVideoCodecError();
    }
  }

  if (onProgress) {
    conversion.onProgress = (p: number) => {
      onProgress(Math.round(p * 100));
    };
  }

  await conversion.execute();
  if (!target.buffer) throw new Error("Mediabunny produced no output");
  return new Blob([target.buffer], { type: file.type || "video/mp4" });
}
