"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";

export function NowCard({ onUseNow }: { onUseNow: (ms: number) => void }) {
  const t = useTranslations("tools.developer.timestamp");
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMs(Date.now());
    const id = window.setInterval(() => setMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const safeMs = ms ?? 0;
  const seconds = ms != null ? Math.floor(safeMs / 1000) : 0;
  const iso = ms != null ? new Date(safeMs).toISOString() : "";

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold">{t("nowCardTitle")}</div>
            <div className="text-xs text-muted-foreground">{t("nowCardSubtitle")}</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => ms != null && onUseNow(ms)} disabled={ms == null}>
          {t("useThisTimestamp")}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <NowField label={t("tsSeconds")} value={ms != null ? String(seconds) : "—"} />
        <NowField label={t("tsMilliseconds")} value={ms != null ? String(safeMs) : "—"} />
        <NowField label={t("isoFormat")} value={iso || "—"} />
      </div>
    </div>
  );
}

function NowField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-sm">{value}</div>
      </div>
      <CopyButton text={value} className="shrink-0" />
    </div>
  );
}
