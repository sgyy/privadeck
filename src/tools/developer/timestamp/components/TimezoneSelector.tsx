"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { COMMON_TIMEZONES, LOCAL_TZ_VALUE } from "../constants";

function getAllTimeZones(): string[] {
  try {
    const intlAny = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    if (typeof intlAny.supportedValuesOf === "function") {
      const zones = intlAny.supportedValuesOf("timeZone");
      if (Array.isArray(zones) && zones.length > 0) return zones;
    }
  } catch {
    /* ignore */
  }
  return COMMON_TIMEZONES;
}

function getOffsetLabel(tz: string): string {
  if (tz === LOCAL_TZ_VALUE) {
    const offsetMin = -new Date().getTimezoneOffset();
    return formatOffset(offsetMin);
  }
  try {
    const date = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (["year", "month", "day", "hour", "minute", "second"].includes(p.type)) {
        map[p.type] = Number(p.value);
      }
    }
    const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour === 24 ? 0 : map.hour, map.minute, map.second);
    const diffMin = Math.round((asUtc - date.getTime()) / 60000);
    return formatOffset(diffMin);
  } catch {
    return "";
  }
}

function formatOffset(min: number): string {
  const sign = min >= 0 ? "+" : "-";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface ZoneEntry {
  value: string;
  label: string;
  offset: string;
}

export function TimezoneSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const t = useTranslations("tools.developer.timestamp");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allEntries = useMemo<ZoneEntry[]>(() => {
    const zones = getAllTimeZones();
    const localLabel = t("timezoneLocal");
    const localEntry: ZoneEntry = {
      value: LOCAL_TZ_VALUE,
      label: localLabel,
      offset: getOffsetLabel(LOCAL_TZ_VALUE),
    };
    const rest = zones.map<ZoneEntry>((z) => ({ value: z, label: z, offset: getOffsetLabel(z) }));
    return [localEntry, ...rest];
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries;
    return allEntries.filter((e) => e.label.toLowerCase().includes(q) || e.value.toLowerCase().includes(q));
  }, [allEntries, query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const [lastSync, setLastSync] = useState<{ open: boolean; filteredLen: number; value: string }>({ open, filteredLen: filtered.length, value });
  if (lastSync.open !== open || lastSync.filteredLen !== filtered.length || lastSync.value !== value) {
    setLastSync({ open, filteredLen: filtered.length, value });
    if (open) {
      const found = filtered.findIndex((e) => e.value === value);
      setActiveIndex((cur) => (found >= 0 ? found : Math.min(cur, Math.max(0, filtered.length - 1))));
    }
  }

  function commit(entry: ZoneEntry) {
    onChange(entry.value);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(Math.max(0, filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[activeIndex]) commit(filtered[activeIndex]);
        break;
    }
  }

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const currentEntry = allEntries.find((e) => e.value === value);
  const displayLabel = currentEntry?.label ?? value;
  const offset = currentEntry?.offset ?? "";
  const reactId = useId();
  const listboxId = `${reactId}-list`;
  const optionId = (i: number) => `${reactId}-opt-${i}`;

  return (
    <div className="space-y-1.5" ref={wrapperRef} onKeyDown={handleKeyDown}>
      <label className="text-sm font-medium">{t("timezone")}</label>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/40",
            open && "border-primary/40 ring-2 ring-primary/20",
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono">{displayLabel}</span>
            {offset && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {offset}
              </span>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[320px] overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={filtered[activeIndex] ? optionId(activeIndex) : undefined}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder={t("searchTimeZone")}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div ref={listRef} id={listboxId} className="max-h-[260px] overflow-y-auto py-1" role="listbox">
              {filtered.map((entry, i) => (
                <div
                  key={entry.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={value === entry.value}
                  data-idx={i}
                  onMouseDown={(e) => { e.preventDefault(); commit(entry); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-sm",
                    i === activeIndex ? "bg-muted/60" : "",
                    value === entry.value && "bg-primary/10 text-primary",
                  )}
                >
                  <span className="truncate font-mono">{entry.label}</span>
                  {entry.offset && <span className="shrink-0 text-[10px] text-muted-foreground">{entry.offset}</span>}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">—</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
