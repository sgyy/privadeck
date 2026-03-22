"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface ToolItem {
  slug: string;
  category: string;
  name: string;
  description: string;
}

interface CategoryItem {
  key: string;
  label: string;
}

interface NotFound404Props {
  tools: ToolItem[];
  categories: CategoryItem[];
  /** Path prefix for tool links, e.g. "/en" or "" (empty for locale-aware routing) */
  pathPrefix?: string;
  labels?: {
    title: string;
    searchHint: string;
    searchPlaceholder: string;
    noToolsFound: string;
  };
}

const categoryColors: Record<string, string> = {
  developer: "bg-purple-500",
  image: "bg-pink-500",
  pdf: "bg-red-500",
  video: "bg-orange-500",
  audio: "bg-green-500",
};

const defaultLabels = {
  title: "Page Not Found",
  searchHint: "Try searching for the tool you need:",
  searchPlaceholder: "Search tools...",
  noToolsFound: "No tools found",
};

export function NotFound404({
  tools,
  categories,
  pathPrefix = "",
  labels = defaultLabels,
}: NotFound404Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? tools.filter((tool) => {
        const q = query.toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.slug.includes(q)
        );
      })
    : [];

  return (
    <div className="space-y-8 py-8">
      {/* 404 Header */}
      <div className="text-center">
        <h1 className="text-7xl font-bold text-muted-foreground/20">404</h1>
        <p className="mt-2 text-xl font-semibold">{labels.title}</p>
        <p className="mt-1 text-muted-foreground">{labels.searchHint}</p>
      </div>

      {/* Search Bar */}
      <div className="mx-auto max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-card/80 py-3 pl-10 pr-4 text-sm outline-none ring-primary/30 transition-shadow placeholder:text-muted-foreground focus:ring-2"
          />
        </div>

        {/* Search Results */}
        {query.trim() && (
          <div className="mt-2 rounded-xl border border-border bg-card/95 shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                {labels.noToolsFound}
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto p-2">
                {filtered.map((tool) => (
                  <Link
                    key={`${tool.category}-${tool.slug}`}
                    href={`${pathPrefix}/tools/${tool.category}/${tool.slug}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${categoryColors[tool.category] || "bg-gray-500"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Grid */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat.key);
          return (
            <div key={cat.key}>
              <h2 className="mb-3 text-lg font-semibold">
                <Link
                  href={`${pathPrefix}/tools/${cat.key}`}
                  className="hover:text-primary transition-colors"
                >
                  {cat.label}
                </Link>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {catTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`${pathPrefix}/tools/${cat.key}/${tool.slug}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <h3 className="text-sm font-medium">{tool.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
