export const SPLIT_COLORS = [
  "border-blue-500 bg-blue-500/15",
  "border-emerald-500 bg-emerald-500/15",
  "border-amber-500 bg-amber-500/15",
  "border-rose-500 bg-rose-500/15",
  "border-violet-500 bg-violet-500/15",
  "border-cyan-500 bg-cyan-500/15",
  "border-orange-500 bg-orange-500/15",
  "border-lime-500 bg-lime-500/15",
] as const;

const NEUTRAL = "border-dashed border-muted-foreground/30 bg-muted/20";

export type ModeContext =
  | { mode: "each"; total: number }
  | { mode: "every"; total: number; n: number }
  | { mode: "oddEven" }
  | { mode: "half"; total: number }
  | { mode: "range"; ranges: [number, number][] }
  | { mode: "size"; total: number }
  | { mode: "outline"; sectionStarts: number[] };

export function pageColor(pageNum: number, ctx: ModeContext): string {
  switch (ctx.mode) {
    case "each":
      return SPLIT_COLORS[(pageNum - 1) % SPLIT_COLORS.length];
    case "every": {
      if (ctx.n <= 0) return NEUTRAL;
      const idx = Math.floor((pageNum - 1) / ctx.n);
      return SPLIT_COLORS[idx % SPLIT_COLORS.length];
    }
    case "oddEven":
      return pageNum % 2 === 1 ? SPLIT_COLORS[0] : SPLIT_COLORS[1];
    case "half": {
      const cut = Math.floor(ctx.total / 2);
      return pageNum <= cut ? SPLIT_COLORS[0] : SPLIT_COLORS[1];
    }
    case "range": {
      const idx = ctx.ranges.findIndex(([s, e]) => pageNum >= s && pageNum <= e);
      if (idx < 0) return NEUTRAL;
      return SPLIT_COLORS[idx % SPLIT_COLORS.length];
    }
    case "size":
      return NEUTRAL;
    case "outline": {
      let idx = -1;
      for (let i = 0; i < ctx.sectionStarts.length; i++) {
        if (pageNum >= ctx.sectionStarts[i]) idx = i;
        else break;
      }
      if (idx < 0) return NEUTRAL;
      return SPLIT_COLORS[idx % SPLIT_COLORS.length];
    }
    default:
      return NEUTRAL;
  }
}

export function partsCount(ctx: ModeContext): number {
  switch (ctx.mode) {
    case "each":
      return ctx.total;
    case "every":
      return ctx.n > 0 ? Math.ceil(ctx.total / ctx.n) : 0;
    case "oddEven":
      return 2;
    case "half":
      return ctx.total >= 2 ? 2 : 1;
    case "range":
      return ctx.ranges.length;
    case "size":
      return 0;
    case "outline":
      return ctx.sectionStarts.length;
    default:
      return 0;
  }
}
