type Segmenter = {
  segment: (input: string) => Iterable<{ segment: string }>;
};

const graphemeSegmenter: Segmenter | null =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new (Intl as unknown as { Segmenter: new (locale: string, opts: object) => Segmenter }).Segmenter(
        "und",
        { granularity: "grapheme" },
      )
    : null;

const wordSegmenter: Segmenter | null =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new (Intl as unknown as { Segmenter: new (locale: string, opts: object) => Segmenter }).Segmenter(
        "und",
        { granularity: "word" },
      )
    : null;

export function splitGraphemes(text: string): string[] {
  if (graphemeSegmenter) {
    const result: string[] = [];
    for (const seg of graphemeSegmenter.segment(text)) result.push(seg.segment);
    return result;
  }
  return Array.from(text);
}

export function splitWords(text: string): string[] {
  if (wordSegmenter) {
    const result: string[] = [];
    for (const seg of wordSegmenter.segment(text)) result.push(seg.segment);
    return result.filter((s) => s.length > 0);
  }
  return text.split(/(\s+)/).filter((s) => s.length > 0);
}

export function measureSpacedTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  const graphemes = splitGraphemes(text);
  let total = 0;
  for (const g of graphemes) total += ctx.measureText(g).width;
  total += Math.max(0, graphemes.length - 1) * letterSpacing;
  return total;
}

export function fillSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  letterSpacing: number,
  align: "left" | "center" | "right",
  drawMode: "fill" | "stroke" | "both" = "fill",
): void {
  const graphemes = splitGraphemes(text);
  if (graphemes.length === 0) return;

  const widths = graphemes.map((g) => ctx.measureText(g).width);
  const totalWidth =
    widths.reduce((a, b) => a + b, 0) +
    Math.max(0, graphemes.length - 1) * letterSpacing;

  let x = cx;
  if (align === "center") x -= totalWidth / 2;
  else if (align === "right") x -= totalWidth;

  ctx.save();
  ctx.textAlign = "left";
  for (let i = 0; i < graphemes.length; i++) {
    if (drawMode === "stroke" || drawMode === "both") {
      ctx.strokeText(graphemes[i], x, y);
    }
    if (drawMode === "fill" || drawMode === "both") {
      ctx.fillText(graphemes[i], x, y);
    }
    x += widths[i] + letterSpacing;
  }
  ctx.restore();
}

/**
 * Greedy line-wrapping: split paragraphs by hard \n first, then wrap each
 * paragraph to maxWidth. Latin words split on spaces; CJK splits per character.
 */
export function wrapTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number,
): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (para.length === 0) {
      lines.push("");
      continue;
    }
    const words = splitWords(para);
    let current = "";
    for (const word of words) {
      const candidate = current + word;
      if (measureSpacedTextWidth(ctx, candidate, letterSpacing) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current.length > 0) {
        lines.push(current);
        current = word.trimStart();
      } else {
        // Single word longer than maxWidth — split per grapheme
        const graphemes = splitGraphemes(word);
        let chunk = "";
        for (const g of graphemes) {
          if (
            measureSpacedTextWidth(ctx, chunk + g, letterSpacing) <= maxWidth ||
            chunk.length === 0
          ) {
            chunk += g;
          } else {
            lines.push(chunk);
            chunk = g;
          }
        }
        current = chunk;
      }
    }
    if (current.length > 0) lines.push(current);
  }
  return lines;
}
