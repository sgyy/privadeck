const BRAND_PREFIX = "PrivaDeck_";

export function brandFilename(filename: string): string {
  if (filename.startsWith(BRAND_PREFIX)) return filename;
  return BRAND_PREFIX + filename;
}
