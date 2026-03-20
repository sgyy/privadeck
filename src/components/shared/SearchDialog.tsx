"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, X } from "lucide-react";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";
import { trackEvent } from "@/lib/analytics";

const categoryColors: Record<string, string> = {
  developer: "bg-purple-500",
  image: "bg-pink-500",
  pdf: "bg-red-500",
  video: "bg-orange-500",
  audio: "bg-green-500",
};

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  toolNavData: ToolNavItem[];
}

export function SearchDialog({ open, onClose, toolNavData }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations("common");

  const tNav = useTranslations("nav");

  const filtered = query.trim()
    ? toolNavData.filter((tool) => {
        const q = query.toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          (tool.nameEn && tool.nameEn.toLowerCase().includes(q)) ||
          (tool.descriptionEn && tool.descriptionEn.toLowerCase().includes(q))
        );
      })
    : [];

  const navigate = useCallback(
    (index: number) => {
      const tool = filtered[index];
      if (tool) {
        trackEvent("search_select", {
          tool_slug: tool.slug,
          tool_category: tool.category,
          query: query.trim(),
          position: index,
        });
        router.push(`/tools/${tool.category}/${tool.slug}`);
        onClose();
        setQuery("");
      }
    },
    [filtered, router, onClose, query],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIndex(0);
      setQuery("");
      trackEvent("search_open");
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Debounced search query tracking
  useEffect(() => {
    if (!open || !query.trim()) return;
    const timer = setTimeout(() => {
      trackEvent("search_query", { query: query.trim(), result_count: filtered.length });
    }, 300);
    return () => clearTimeout(timer);
  }, [open, query, filtered.length]);

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
            placeholder={t("searchPlaceholder")}
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

        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("searchPlaceholder")}
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("noToolsFound")}
            </p>
          ) : (
            filtered.map((tool, i) => (
              <button
                key={tool.slug}
                type="button"
                onClick={() => navigate(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  i === selectedIndex ? "bg-accent" : "hover:bg-muted"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${categoryColors[tool.category] || "bg-gray-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {tool.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {tool.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {tNav(tool.category)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex gap-4">
          <span>↑↓ {t("searchNavigate")}</span>
          <span>↵ {t("searchOpen")}</span>
          <span>Esc {t("searchClose")}</span>
        </div>
      </div>
    </>
  );
}
