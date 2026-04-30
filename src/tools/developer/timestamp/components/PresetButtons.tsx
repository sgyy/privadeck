"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { adjustMs, getPreset, type Preset } from "../logic";

const PRESETS: { key: Preset; labelKey: string }[] = [
  { key: "now", labelKey: "presetNow" },
  { key: "today", labelKey: "presetToday" },
  { key: "yesterday", labelKey: "presetYesterday" },
  { key: "tomorrow", labelKey: "presetTomorrow" },
  { key: "monthStart", labelKey: "presetMonthStart" },
  { key: "yearStart", labelKey: "presetYearStart" },
];

const STEPS_NEG = [
  { label: "-1d", ms: -86_400_000 },
  { label: "-1h", ms: -3_600_000 },
  { label: "-1m", ms: -60_000 },
  { label: "-1s", ms: -1_000 },
];

const STEPS_POS = [
  { label: "+1s", ms: 1_000 },
  { label: "+1m", ms: 60_000 },
  { label: "+1h", ms: 3_600_000 },
  { label: "+1d", ms: 86_400_000 },
];

export function PresetButtons({
  tz,
  currentMs,
  onChange,
}: {
  tz: string;
  currentMs: number | null;
  onChange: (ms: number) => void;
}) {
  const t = useTranslations("tools.developer.timestamp");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">{t("presetsLabel")}</span>
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant="outline"
            onClick={() => onChange(getPreset(p.key, tz))}
          >
            {t(p.labelKey)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">{t("adjustLabel")}</span>
        {STEPS_NEG.map((s) => (
          <Button
            key={s.label}
            size="sm"
            variant="outline"
            disabled={currentMs == null}
            onClick={() => currentMs != null && onChange(adjustMs(currentMs, s.ms))}
            className="font-mono"
          >
            {s.label}
          </Button>
        ))}
        <span aria-hidden="true" className="mx-1 text-muted-foreground/40">·</span>
        {STEPS_POS.map((s) => (
          <Button
            key={s.label}
            size="sm"
            variant="outline"
            disabled={currentMs == null}
            onClick={() => currentMs != null && onChange(adjustMs(currentMs, s.ms))}
            className="font-mono"
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
