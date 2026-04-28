"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { SplitMode, OutlineSection } from "../logic";

interface ModeOptionsPanelProps {
  mode: SplitMode;
  pageCount: number;
  everyN: number;
  setEveryN: (n: number) => void;
  rangeInput: string;
  setRangeInput: (s: string) => void;
  mergeAllRanges: boolean;
  setMergeAllRanges: (v: boolean) => void;
  maxSize: number;
  maxSizeUnit: "KB" | "MB";
  setMaxSize: (n: number) => void;
  setMaxSizeUnit: (u: "KB" | "MB") => void;
  outlineSections: OutlineSection[] | null;
}

export function ModeOptionsPanel(props: ModeOptionsPanelProps) {
  const t = useTranslations("tools.pdf.split");
  const {
    mode,
    pageCount,
    everyN,
    setEveryN,
    rangeInput,
    setRangeInput,
    mergeAllRanges,
    setMergeAllRanges,
    maxSize,
    maxSizeUnit,
    setMaxSize,
    setMaxSizeUnit,
    outlineSections,
  } = props;

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 text-sm">
      {mode === "each" && (
        <p className="text-muted-foreground">{t("modes.each.desc")}</p>
      )}

      {mode === "every" && (
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("modes.every.desc")}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="every-n" className="font-medium">
              {t("every.label")}
            </label>
            <input
              id="every-n"
              type="number"
              min={1}
              max={Math.max(1, pageCount - 1)}
              value={everyN}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 1) setEveryN(v);
              }}
              className="w-24 rounded-lg border border-border bg-background px-3 py-1.5"
            />
            {pageCount > 0 && everyN > 0 && (
              <span className="text-xs text-muted-foreground">
                {t("every.preview", { count: Math.ceil(pageCount / everyN) })}
              </span>
            )}
          </div>
        </div>
      )}

      {mode === "oddEven" && (
        <p className="text-muted-foreground">{t("modes.oddEven.desc")}</p>
      )}

      {mode === "half" && (
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("modes.half.desc")}</p>
          {pageCount >= 2 && (
            <p className="text-xs text-muted-foreground">
              {t("half.preview", {
                a: Math.floor(pageCount / 2),
                b: pageCount - Math.floor(pageCount / 2),
              })}
            </p>
          )}
        </div>
      )}

      {mode === "range" && (
        <div className="space-y-3">
          <p className="text-muted-foreground">{t("modes.range.desc")}</p>
          <input
            type="text"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            placeholder={t("rangePlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
          <p className="text-xs text-muted-foreground">{t("range.clickToBuild")}</p>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={mergeAllRanges}
              onChange={(e) => setMergeAllRanges(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span>{t("range.mergeAll")}</span>
          </label>
        </div>
      )}

      {mode === "size" && (
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("modes.size.desc")}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="max-size" className="font-medium">
              {t("size.label")}
            </label>
            <input
              id="max-size"
              type="number"
              min={0.1}
              step={0.1}
              value={maxSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) setMaxSize(v);
              }}
              className="w-24 rounded-lg border border-border bg-background px-3 py-1.5"
            />
            <select
              value={maxSizeUnit}
              onChange={(e) => setMaxSizeUnit(e.target.value as "KB" | "MB")}
              className="rounded-lg border border-border bg-background px-2 py-1.5"
            >
              <option value="MB">{t("size.unitMB")}</option>
              <option value="KB">{t("size.unitKB")}</option>
            </select>
          </div>
        </div>
      )}

      {mode === "outline" && (
        <div className="space-y-2">
          <p className="text-muted-foreground">{t("modes.outline.desc")}</p>
          {outlineSections && outlineSections.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                {t("outline.found", { count: outlineSections.length })} ·{" "}
                {t("outline.willCreate", { count: outlineSections.length })}
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-border/50 bg-background/50 p-2 text-xs">
                {outlineSections.map((s, i) => (
                  <li key={i} className={cn("truncate")}>
                    <span className="text-muted-foreground">
                      p.{s.pageIndex + 1}
                    </span>
                    <span className="ml-2">{s.title}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("outline.noOutline")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
