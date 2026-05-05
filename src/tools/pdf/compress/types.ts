export type PdfQuality = "high" | "medium" | "low" | "custom";
export type CompressMode = "image-optimize" | "rasterize" | "auto";

export interface CompressReportItem {
  index: number;
  label: string;
  beforeBytes: number;
  afterBytes: number;
}

export interface CompressReport {
  items: CompressReportItem[];
}

export interface CleanupOptions {
  removeMetadata?: boolean;
}

export interface CompressOptions {
  mode: CompressMode;
  quality: PdfQuality;
  customDpi?: number;
  customJpegQuality?: number;
  cleanup?: CleanupOptions;
  signal?: AbortSignal;
}

export type SizeMode = "preset" | "target";

export interface TargetSizeOptions {
  mode: CompressMode;
  targetBytes: number;
  cleanup?: CleanupOptions;
  signal?: AbortSignal;
}

export type ProgressEvent =
  | { kind: "page"; current: number; total: number }
  | { kind: "image"; current: number; total: number };

export type ProgressCallback = (event: ProgressEvent) => void;

export interface CompressResult {
  blob: Blob;
  usedOriginal: boolean;
  modeUsed: Exclude<CompressMode, "auto">;
  detectedMode?: Exclude<CompressMode, "auto">;
  targetMet?: boolean;
  report?: CompressReport;
}
