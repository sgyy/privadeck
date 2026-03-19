"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { computeDiff, toUnifiedDiff, type DiffLine } from "./logic";

export default function TextDiff() {
  const t = useTranslations("tools.developer.text-diff");
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [hasCompared, setHasCompared] = useState(false);

  const [error, setError] = useState("");

  function handleCompare() {
    setError("");
    try {
      const result = computeDiff(original, modified);
      setDiffLines(result);
      setHasCompared(true);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  const unifiedText = hasCompared ? toUnifiedDiff(diffLines) : "";

  const stats = hasCompared
    ? {
        additions: diffLines.filter((l) => l.type === "add").length,
        removals: diffLines.filter((l) => l.type === "remove").length,
      }
    : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("originalLabel")}</label>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder={t("originalPlaceholder")}
            className="w-full min-h-[200px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("modifiedLabel")}</label>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder={t("modifiedPlaceholder")}
            className="w-full min-h-[200px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
          />
        </div>
      </div>

      <div>
        <Button
          onClick={handleCompare}
          disabled={!original.trim() && !modified.trim()}
        >
          {t("compare")}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {hasCompared && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">{t("resultLabel")}</span>
              {stats && (
                <>
                  <span className="text-green-600 dark:text-green-400">
                    +{stats.additions}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{stats.removals}
                  </span>
                </>
              )}
            </div>
            {unifiedText && <CopyButton text={unifiedText} />}
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm overflow-x-auto">
            {diffLines.length === 0 ? (
              <div className="text-muted-foreground">{t("noDifferences")}</div>
            ) : (
              diffLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === "add"
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : line.type === "remove"
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : "text-muted-foreground"
                  }
                >
                  <span className="select-none inline-block w-5 text-center opacity-60">
                    {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                  </span>
                  {line.text || "\u00A0"}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
