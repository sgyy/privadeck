/**
 * Parse a page-range expression like "1-3, 5, 7-10" into an ordered, deduped
 * list of 1-based page numbers, clamped to [1, totalPages].
 *
 * Empty/whitespace input or no valid ranges yields an empty array, signalling
 * "all pages" to callers.
 */
export function parsePageRange(input: string, totalPages: number): number[] {
  if (!input.trim() || totalPages <= 0) return [];
  const seen = new Set<number>();
  for (const raw of input.split(",")) {
    const seg = raw.trim();
    if (!seg) continue;
    const parts = seg.split("-").map((p) => Number(p.trim()));
    if (parts.length > 2 || parts.some((n) => !Number.isFinite(n))) continue;
    const a = parts[0];
    const b = parts.length === 1 ? a : parts[1];
    if (a < 1 || b < a) continue;
    const start = Math.max(1, Math.min(a, totalPages));
    const end = Math.max(1, Math.min(b, totalPages));
    for (let i = start; i <= end; i++) seen.add(i);
  }
  return Array.from(seen).sort((x, y) => x - y);
}
