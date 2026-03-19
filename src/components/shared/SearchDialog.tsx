"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { Search, X } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const tt = useTranslations("tools");

  const allTools = getAllTools();

  const filtered = query.trim()
    ? allTools.filter((tool) => {
        const name = tt(`${tool.category}.${tool.slug}.name`).toLowerCase();
        const desc = tt(`${tool.category}.${tool.slug}.description`).toLowerCase();
        const q = query.toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : allTools;

  const navigate = useCallback(
    (index: number) => {
      const tool = filtered[index];
      if (tool) {
        router.push(`/tools/${tool.category}/${tool.slug}`);
        onClose();
        setQuery("");
      }
    },
    [filtered, router, onClose],
  );

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        navigate(selectedIndex);
        break;
      case "Escape":
        onClose();
        break;
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No tools found
            </p>
          ) : (
            filtered.map((tool, i) => (
              <button
                key={tool.slug}
                type="button"
                onClick={() => navigate(i)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  i === selectedIndex ? "bg-accent" : "hover:bg-muted"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {tt(`${tool.category}.${tool.slug}.name`)}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {tt(`${tool.category}.${tool.slug}.description`)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </>
  );
}
