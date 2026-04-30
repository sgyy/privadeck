"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NowCard({ onUseNow }: { onUseNow: (ms: number) => void }) {
  const t = useTranslations("tools.developer.timestamp");
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMs(Date.now());
    const id = window.setInterval(() => setMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const seconds = ms != null ? String(Math.floor(ms / 1000)) : "—";
  const msStr = ms != null ? String(ms) : "—";
  const iso = ms != null ? new Date(ms).toISOString() : "—";

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{t("nowCardTitle")}</div>
            <div className="text-xs text-muted-foreground">{t("nowCardSubtitle")}</div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ms != null && onUseNow(ms)}
          disabled={ms == null}
        >
          {t("useThisTimestamp")}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs">
        <InlineValue label="s" value={seconds} disabled={ms == null} />
        <InlineValue label="ms" value={msStr} disabled={ms == null} />
        <InlineValue label="ISO" value={iso} disabled={ms == null} truncate />
      </div>
    </div>
  );
}

function InlineValue({
  label,
  value,
  truncate,
  disabled,
}: {
  label: string;
  value: string;
  truncate?: boolean;
  disabled?: boolean;
}) {
  return (
    <span className={truncate ? "flex min-w-0 max-w-full items-center gap-1.5" : "flex items-center gap-1.5"}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={truncate ? "min-w-0 truncate" : ""} title={value}>
        {value}
      </span>
      <InlineCopy text={value} disabled={disabled} />
    </span>
  );
}

function InlineCopy({ text, disabled }: { text: string; disabled?: boolean }) {
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [text, disabled]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      title={tc(copied ? "copied" : "copy")}
      aria-label={tc(copied ? "copied" : "copy")}
      className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
