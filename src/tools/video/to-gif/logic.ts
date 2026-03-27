import { execWithMount } from "@/lib/ffmpeg";

export type GifQuality = "small" | "balanced" | "high";

export interface GifOptions {
  fps: number;
  width: number;
  startTime?: number;
  endTime?: number;
  quality?: GifQuality;
}

export async function videoToGif(
  file: File,
  options: GifOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const outputName = "output.gif";

  const data = await execWithMount(file, (inputPath) => {
    // Place -ss before -i for fast input seek
    const args: string[] = [];
    if (options.startTime !== undefined && options.startTime > 0) {
      args.push("-ss", String(options.startTime));
    }
    args.push("-i", inputPath);
    if (options.endTime !== undefined) {
      // With input seek, -t (duration) is relative to seek point
      const duration = options.endTime - (options.startTime || 0);
      if (duration > 0) args.push("-t", String(duration));
    }

    args.push(
      "-vf",
      buildFilterChain(options),
      "-loop", "0",
      outputName,
    );
    return args;
  }, outputName, onProgress);
  return new Blob([data as BlobPart], { type: "image/gif" });
}

const qualityPresets = {
  small:    { palettegen: "stats_mode=diff", paletteuse: "dither=bayer:bayer_scale=5:diff_mode=rectangle" },
  balanced: { palettegen: "stats_mode=diff", paletteuse: "dither=bayer:bayer_scale=3:diff_mode=rectangle" },
  high:     { palettegen: "",                paletteuse: "" },
};

function buildFilterChain(options: GifOptions): string {
  const p = qualityPresets[options.quality ?? "balanced"];
  const base = `fps=${options.fps},scale=${options.width}:-1:flags=lanczos`;
  const pg = p.palettegen ? `palettegen=${p.palettegen}` : "palettegen";
  const pu = p.paletteuse ? `paletteuse=${p.paletteuse}` : "paletteuse";
  return `${base},split[s0][s1];[s0]${pg}[p];[s1][p]${pu}`;
}
