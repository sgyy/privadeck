"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/shared/CopyButton";
import { parseColor, type ColorValues } from "./logic";

export default function ColorConverter() {
  const [input, setInput] = useState("");
  const t = useTranslations("tools.developer.color-converter");

  const color: ColorValues | null = useMemo(() => {
    if (!input.trim()) return null;
    return parseColor(input);
  }, [input]);

  const formats = color
    ? [
        { label: "HEX", value: color.hex },
        { label: "RGB", value: color.rgb },
        { label: "HSL", value: color.hsl },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("inputLabel")}</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
        />
      </div>

      {input.trim() && !color && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {t("invalidColor")}
        </div>
      )}

      {color && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("preview")}</label>
            <div
              className="h-24 w-full rounded-lg border border-border"
              style={{ backgroundColor: color.hex }}
            />
          </div>

          <div className="space-y-3">
            {formats.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <CopyButton text={value} />
                </div>
                <p className="font-mono text-sm mt-1 text-muted-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-sm font-medium">{t("values")}</span>
            <div className="grid grid-cols-3 gap-2 mt-2 text-sm font-mono">
              <div>
                <span className="text-muted-foreground">R:</span> {color.r}
              </div>
              <div>
                <span className="text-muted-foreground">G:</span> {color.g}
              </div>
              <div>
                <span className="text-muted-foreground">B:</span> {color.b}
              </div>
              <div>
                <span className="text-muted-foreground">H:</span> {color.h}
              </div>
              <div>
                <span className="text-muted-foreground">S:</span> {color.s}%
              </div>
              <div>
                <span className="text-muted-foreground">L:</span> {color.l}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
