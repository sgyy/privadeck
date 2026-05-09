"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";

export interface FontItem {
  /** Stable identifier — used as React key and for matching the active row. */
  key: string;
  /** CSS font-family value to apply to canvas + preview. */
  family: string;
  /** Localized group label (e.g. "Sans", "System fonts"). Items in the same group are rendered together. */
  group: string;
  /** Group ordering hint; lower comes first. */
  groupOrder: number;
}

interface FontComboboxProps {
  items: FontItem[];
  /** Selected family or null for "system default". */
  value: string | null;
  /** Translation key for the "system default" entry shown when value is null. */
  defaultLabel: string;
  onChange: (family: string) => void;
  /** Optional inline status (e.g. "loading…") rendered next to the trigger. */
  status?: string | null;
}

/**
 * Searchable, grouped font picker. Replaces the native <select> so the user
 * can filter 500+ system fonts and see each font name rendered in its own
 * face before committing.
 *
 * Internals:
 * - Trigger button stores the open state. Click toggles.
 * - When open, an autofocused search input filters the list. Filter is a
 *   case-insensitive substring match on family name.
 * - ArrowUp / ArrowDown move the active row, Enter commits it, Escape closes.
 * - Click outside closes via a document-level mousedown listener.
 */
export function FontCombobox({
  items,
  value,
  defaultLabel,
  onChange,
  status,
}: FontComboboxProps) {
  const t = useTranslations("tools.image.add-text");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // The "system default" pseudo-entry sits above all real items. We special-case
  // its key so external code can stay shape-stable (always `family: string`).
  const DEFAULT_KEY = "__default";

  // Filter + group. Memoised so typing in the search field doesn't re-allocate
  // for the unchanged items array.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchDefault = q === "" || defaultLabel.toLowerCase().includes(q);
    const matched = q
      ? items.filter((it) => it.family.toLowerCase().includes(q))
      : items;
    // Stable sort by (groupOrder, family) — Array.sort is stable in modern engines
    // but we sort a copy because items is shared.
    const sorted = [...matched].sort((a, b) => {
      if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
      return a.family.localeCompare(b.family);
    });
    return { matchDefault, sorted };
  }, [items, query, defaultLabel]);

  const flatKeys = useMemo(() => {
    const keys: string[] = [];
    if (filtered.matchDefault) keys.push(DEFAULT_KEY);
    for (const it of filtered.sorted) keys.push(it.key);
    return keys;
  }, [filtered]);

  // Open/close handler. Resetting query + active row lives here (not in an
  // effect) so the new react-hooks/set-state-in-effect rule stays happy.
  const toggleOpen = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    const initial =
      value === null
        ? DEFAULT_KEY
        : (items.find((it) => it.family === value)?.key ?? DEFAULT_KEY);
    setActiveKey(initial);
    setOpen(true);
    // autofocus the input on the next paint so the click-to-open isn't eaten.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, value, items]);

  // Click-outside dismissal.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const node = wrapperRef.current;
      if (node && !node.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Scroll the active row into view as it changes (keyboard nav).
  useLayoutEffect(() => {
    if (!open || !activeKey || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-fc-key="${CSS.escape(activeKey)}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeKey, open]);

  const commit = useCallback(
    (key: string) => {
      if (key === DEFAULT_KEY) onChange("system-ui");
      else {
        const it = items.find((x) => x.key === key);
        if (it) onChange(it.family);
      }
      setOpen(false);
    },
    [items, onChange],
  );

  const moveActive = useCallback(
    (delta: 1 | -1) => {
      if (flatKeys.length === 0) return;
      const idx = activeKey ? flatKeys.indexOf(activeKey) : -1;
      // No active row yet → ArrowDown lands on first, ArrowUp lands on last.
      // The naive `(idx + delta + len) % len` puts ArrowUp at penultimate.
      const next =
        idx === -1
          ? delta === 1
            ? 0
            : flatKeys.length - 1
          : (idx + delta + flatKeys.length) % flatKeys.length;
      setActiveKey(flatKeys[next]);
    },
    [activeKey, flatKeys],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeKey) commit(activeKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // Group the sorted items by group label for rendering. Doing it here avoids
  // a second pass during render and keeps the JSX flat.
  const groupedForRender = useMemo(() => {
    const out: Array<{ label: string; items: FontItem[] }> = [];
    let cursor: { label: string; items: FontItem[] } | null = null;
    for (const it of filtered.sorted) {
      if (!cursor || cursor.label !== it.group) {
        cursor = { label: it.group, items: [] };
        out.push(cursor);
      }
      cursor.items.push(it);
    }
    return out;
  }, [filtered.sorted]);

  const triggerLabel = value
    ? (items.find((it) => it.family === value)?.family ?? value)
    : defaultLabel;
  const triggerStyle =
    value && value !== "system-ui"
      ? { fontFamily: `"${value}", system-ui, sans-serif` }
      : undefined;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/50"
      >
        <span className="truncate text-left" style={triggerStyle}>
          {triggerLabel}
          {status && (
            <span className="ml-2 text-xs text-muted-foreground">{status}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // Reset active to the first match so Enter picks something sensible.
                setActiveKey(null);
              }}
              onKeyDown={onKeyDown}
              placeholder={t("searchFonts")}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {flatKeys.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                {t("noFontsMatching", { query })}
              </p>
            ) : (
              <>
                {filtered.matchDefault && (
                  <Row
                    fcKey={DEFAULT_KEY}
                    label={defaultLabel}
                    family={null}
                    active={activeKey === DEFAULT_KEY}
                    selected={value === null}
                    onPick={() => commit(DEFAULT_KEY)}
                    onHover={() => setActiveKey(DEFAULT_KEY)}
                  />
                )}
                {groupedForRender.map((g) => (
                  <div key={g.label}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.label}
                    </p>
                    {g.items.map((it) => (
                      <Row
                        key={it.key}
                        fcKey={it.key}
                        label={it.family}
                        family={it.family}
                        active={activeKey === it.key}
                        selected={value === it.family}
                        onPick={() => commit(it.key)}
                        onHover={() => setActiveKey(it.key)}
                      />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  fcKey: string;
  label: string;
  /** Apply this family to the row preview. Null → no inline font (default UI font). */
  family: string | null;
  active: boolean;
  selected: boolean;
  onPick: () => void;
  onHover: () => void;
}

function Row({ fcKey, label, family, active, selected, onPick, onHover }: RowProps) {
  return (
    <button
      type="button"
      data-fc-key={fcKey}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      onMouseMove={onHover}
      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${
        active ? "bg-muted" : ""
      } ${selected ? "font-medium text-primary" : ""}`}
    >
      <span
        className="truncate"
        style={family ? { fontFamily: `"${family}", system-ui, sans-serif` } : undefined}
      >
        {label}
      </span>
    </button>
  );
}
