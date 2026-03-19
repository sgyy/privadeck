"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/shared/CopyButton";
import { testRegex, highlightMatches } from "./logic";

const FLAG_OPTIONS = [
  { flag: "g", label: "Global" },
  { flag: "i", label: "Case Insensitive" },
  { flag: "m", label: "Multiline" },
  { flag: "s", label: "Dotall" },
];

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const t = useTranslations("tools.developer.regex-tester");

  const { matches, error } = useMemo(
    () => testRegex(pattern, flags, text),
    [pattern, flags, text]
  );

  const highlighted = useMemo(
    () => highlightMatches(pattern, flags, text),
    [pattern, flags, text]
  );

  function toggleFlag(flag: string) {
    setFlags((prev) =>
      prev.includes(flag) ? prev.replace(flag, "") : prev + flag
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("patternLabel")}</label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-sm">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t("patternPlaceholder")}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <span className="text-muted-foreground font-mono text-sm">
            /{flags}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("flagsLabel")}</label>
        <div className="flex flex-wrap gap-3">
          {FLAG_OPTIONS.map((opt) => (
            <label key={opt.flag} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={flags.includes(opt.flag)}
                onChange={() => toggleFlag(opt.flag)}
                className="rounded border-border"
              />
              <span className="font-mono">{opt.flag}</span>
              <span className="text-muted-foreground">({opt.label})</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("testStringLabel")}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("testStringPlaceholder")}
          className="w-full min-h-[150px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {text && pattern && !error && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("matchesLabel")} ({matches.length})
              </label>
            </div>
            <pre
              className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 font-mono text-sm whitespace-pre-wrap break-all overflow-auto"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>

          {matches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t("matchDetails")}</label>
                <CopyButton
                  text={matches
                    .map(
                      (m, i) =>
                        `Match ${i + 1}: "${m.match}" at index ${m.index}`
                    )
                    .join("\n")}
                />
              </div>
              <div className="rounded-lg border border-border bg-background divide-y divide-border">
                {matches.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 text-sm">
                    <span className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono break-all">
                        &quot;{m.match}&quot;
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Index: {m.index}
                      </p>
                      {m.groups && Object.keys(m.groups).length > 0 && (
                        <p className="text-muted-foreground text-xs mt-1">
                          Groups:{" "}
                          {Object.entries(m.groups)
                            .map(([k, v]) => `${k}: "${v}"`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
