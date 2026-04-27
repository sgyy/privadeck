"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  RotateCw,
  Image as ImageIcon,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { PdfPagePreview } from "@/components/shared/PdfPagePreview";
import { PdfBlobPreview } from "@/components/shared/PdfBlobPreview";
import { Button } from "@/components/ui/Button";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import { mergeItems, formatFileSize, type MergeItem } from "./logic";

const tracker = createToolTracker("merge", "pdf");

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp,image/avif";

type PdfItemState = {
  id: string;
  kind: "pdf";
  file: File;
  pdfDoc: PDFDocumentProxy | null;
  pageCount: number;
  thumbnail: string | null;
  selectedPages: Set<number>;
  rotations: Record<number, number>;
  expanded: boolean;
  loading: boolean;
  error: string;
};
type ImageItemState = {
  id: string;
  kind: "image";
  file: File;
  thumbnailUrl: string;
};
type BlankItemState = { id: string; kind: "blank" };
type ItemState = PdfItemState | ImageItemState | BlankItemState;

type SortMode = "manual" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}
function isImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|heic|heif|webp|avif)$/i.test(file.name);
}

export default function MergePdf() {
  const t = useTranslations("tools.pdf.merge");

  const [items, setItems] = useState<ItemState[]>([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [customFilename, setCustomFilename] = useState("");

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const unmountedRef = useRef(false);
  const removedIdsRef = useRef<Set<string>>(new Set());
  const mergingRef = useRef(false);

  useEffect(() => {
    // Reset on (re)mount — StrictMode mounts twice in dev; without this the
    // second mount would inherit unmountedRef.current === true from the first
    // unmount and silently destroy every freshly loaded pdfDoc.
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      for (const it of itemsRef.current) {
        if (it.kind === "pdf") it.pdfDoc?.destroy();
        if (it.kind === "image") URL.revokeObjectURL(it.thumbnailUrl);
      }
    };
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const accepted: ItemState[] = [];
    for (const file of files) {
      if (isPdf(file)) {
        accepted.push({
          id: uid(),
          kind: "pdf",
          file,
          pdfDoc: null,
          pageCount: 0,
          thumbnail: null,
          selectedPages: new Set(),
          rotations: {},
          expanded: false,
          loading: true,
          error: "",
        });
      } else if (isImage(file)) {
        accepted.push({
          id: uid(),
          kind: "image",
          file,
          thumbnailUrl: URL.createObjectURL(file),
        });
      }
    }
    if (accepted.length === 0) return;
    setItems((prev) => [...prev, ...accepted]);
    setResult(null);
    setSortMode("manual");

    const pdfQueue = accepted.filter(
      (it): it is PdfItemState => it.kind === "pdf",
    );
    const loadOne = async (item: PdfItemState) => {
      try {
        const { pdfDoc, pageCount, thumbnail } = await getPdfPreview(
          item.file,
          { thumbnailWidth: 80 },
        );
        // If the component unmounted or the item was removed while loading,
        // destroy the freshly-created pdfDoc to avoid leaking PDFDocumentProxy.
        if (
          unmountedRef.current ||
          removedIdsRef.current.has(item.id)
        ) {
          pdfDoc.destroy();
          return;
        }
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id && it.kind === "pdf"
              ? {
                  ...it,
                  pdfDoc,
                  pageCount,
                  thumbnail,
                  selectedPages: new Set(
                    Array.from({ length: pageCount }, (_, i) => i + 1),
                  ),
                  loading: false,
                }
              : it,
          ),
        );
      } catch (e) {
        if (unmountedRef.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        tracker.trackProcessError(msg);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id && it.kind === "pdf"
              ? { ...it, loading: false, error: msg }
              : it,
          ),
        );
      }
    };
    const CONCURRENCY = 3;
    void Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        for (;;) {
          const next = pdfQueue.shift();
          if (!next) return;
          await loadOne(next);
        }
      }),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    removedIdsRef.current.add(id);
    const target = itemsRef.current.find((it) => it.id === id);
    if (target?.kind === "pdf") target.pdfDoc?.destroy();
    if (target?.kind === "image") URL.revokeObjectURL(target.thumbnailUrl);
    setItems((prev) => prev.filter((it) => it.id !== id));
    setResult(null);
  }, []);

  const moveItem = useCallback((id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const out = [...prev];
      [out[idx], out[next]] = [out[next], out[idx]];
      return out;
    });
    setSortMode("manual");
    setResult(null);
  }, []);

  const togglePage = useCallback((id: string, page: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id || it.kind !== "pdf") return it;
        const next = new Set(it.selectedPages);
        if (next.has(page)) next.delete(page);
        else next.add(page);
        return { ...it, selectedPages: next };
      }),
    );
    setResult(null);
  }, []);

  const rotatePage = useCallback(
    (id: string, originalIdx: number, delta: number) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id || it.kind !== "pdf") return it;
          const cur = it.rotations[originalIdx] ?? 0;
          const next = (((cur + delta) % 360) + 360) % 360;
          const rotations = { ...it.rotations };
          if (next === 0) delete rotations[originalIdx];
          else rotations[originalIdx] = next;
          return { ...it, rotations };
        }),
      );
      setResult(null);
    },
    [],
  );

  const toggleExpand = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id || it.kind !== "pdf") return it;
        return { ...it, expanded: !it.expanded };
      }),
    );
  }, []);

  const insertBlankAfter = useCallback((idx: number) => {
    setItems((prev) => {
      const blank: BlankItemState = { id: uid(), kind: "blank" };
      const out = [...prev];
      out.splice(idx + 1, 0, blank);
      return out;
    });
    setSortMode("manual");
    setResult(null);
  }, []);

  const clearAll = useCallback(() => {
    for (const it of itemsRef.current) {
      removedIdsRef.current.add(it.id);
      if (it.kind === "pdf") it.pdfDoc?.destroy();
      if (it.kind === "image") URL.revokeObjectURL(it.thumbnailUrl);
    }
    setItems([]);
    setResult(null);
    setError("");
    setShowClearConfirm(false);
    setPreviewOpen(false);
  }, []);

  const applySort = useCallback((mode: SortMode) => {
    setSortMode(mode);
    if (mode === "manual") return;
    setItems((prev) => {
      const sorted = [...prev];
      sorted.sort((a, b) => {
        const fa = a.kind === "blank" ? null : a.file;
        const fb = b.kind === "blank" ? null : b.file;
        if (!fa && !fb) return 0;
        if (!fa) return 1;
        if (!fb) return -1;
        switch (mode) {
          case "name-asc":
            return fa.name.localeCompare(fb.name);
          case "name-desc":
            return fb.name.localeCompare(fa.name);
          case "size-desc":
            return fb.size - fa.size;
          case "size-asc":
            return fa.size - fb.size;
          default:
            return 0;
        }
      });
      return sorted;
    });
    setResult(null);
  }, []);

  const validCount = useMemo(
    () =>
      items.filter((it) => {
        if (it.kind === "pdf")
          return !it.loading && !it.error && it.selectedPages.size > 0;
        return true;
      }).length,
    [items],
  );

  const handleMerge = useCallback(async () => {
    // Synchronous guard against double-click; setMerging(true) is async and
    // can let a second click slip past the disabled prop in the same tick.
    if (validCount < 2 || mergingRef.current) return;
    mergingRef.current = true;
    setMerging(true);
    setError("");
    setResult(null);
    setPreviewOpen(false);
    const start = Date.now();

    try {
      const ready: MergeItem[] = items
        .filter((it) => {
          if (it.kind === "pdf")
            return !it.loading && !it.error && it.selectedPages.size > 0;
          return true;
        })
        .map((it) => {
          if (it.kind === "pdf") {
            const pageIndices = Array.from(it.selectedPages)
              .sort((a, b) => a - b)
              .map((p) => p - 1);
            return {
              id: it.id,
              kind: "pdf",
              file: it.file,
              pageIndices,
              rotations: it.rotations,
            };
          }
          if (it.kind === "image") {
            return { id: it.id, kind: "image", file: it.file };
          }
          return { id: it.id, kind: "blank" };
        });

      const blob = await mergeItems(ready, {
        metadata: {
          title: title.trim() || undefined,
          author: author.trim() || undefined,
          subject: subject.trim() || undefined,
          keywords: keywords.trim() || undefined,
        },
      });
      setResult(blob);
      tracker.trackProcessComplete(Date.now() - start);
    } catch (e) {
      console.error("Merge failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      tracker.trackProcessError(msg);
    } finally {
      mergingRef.current = false;
      setMerging(false);
    }
  }, [items, title, author, subject, keywords, validCount]);

  const computedFilename = useMemo(() => {
    // Strip path separators and characters disallowed in filenames on Windows/macOS/Linux,
    // then trim leading/trailing underscores so an all-illegal input doesn't yield "___.pdf".
    const sanitize = (s: string) =>
      s.replace(/[/\\:*?"<>|\x00-\x1f]/g, "_").replace(/^_+|_+$/g, "");
    if (customFilename.trim()) {
      const cleaned = sanitize(customFilename.trim().replace(/\.pdf$/i, ""));
      return `${cleaned || "merged"}.pdf`;
    }
    const first = items.find((it) => it.kind !== "blank") as
      | PdfItemState
      | ImageItemState
      | undefined;
    if (first) {
      const base = sanitize(first.file.name.replace(/\.[^.]+$/, ""));
      return `${base || "merged"}_merged.pdf`;
    }
    return "merged.pdf";
  }, [customFilename, items]);

  return (
    <div className="space-y-4">
      <FileDropzone
        accept={ACCEPT}
        multiple
        onFiles={handleFiles}
        analyticsSlug="merge"
        analyticsCategory="pdf"
      />

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("sortLabel")}:
            </span>
            {(
              [
                ["manual", "sortManual"],
                ["name-asc", "sortNameAZ"],
                ["name-desc", "sortNameZA"],
                ["size-desc", "sortLargest"],
                ["size-asc", "sortSmallest"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => applySort(mode)}
                disabled={merging}
                aria-pressed={sortMode === mode}
                className={`rounded-md px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  sortMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(label)}
              </button>
            ))}
            <div className="ms-auto">
              {showClearConfirm ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {t("clearAllConfirm")}
                  </span>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    {t("clearAllYes")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    {t("clearAllCancel")}
                  </Button>
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={merging}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("clearAll")}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                index={idx}
                total={items.length}
                disabled={merging}
                onRemove={removeItem}
                onMove={moveItem}
                onToggleExpand={toggleExpand}
                onTogglePage={togglePage}
                onRotatePage={rotatePage}
              />
            ))}
            <button
              type="button"
              onClick={() => insertBlankAfter(items.length - 1)}
              disabled={merging}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("addBlankPage")}
            </button>
          </div>

          <Accordion>
            <AccordionItem title={t("advancedOptions")}>
              <div className="space-y-3 pt-2">
                <Field
                  label={t("metadataTitle")}
                  value={title}
                  onChange={setTitle}
                />
                <Field
                  label={t("metadataAuthor")}
                  value={author}
                  onChange={setAuthor}
                />
                <Field
                  label={t("metadataSubject")}
                  value={subject}
                  onChange={setSubject}
                />
                <Field
                  label={t("metadataKeywords")}
                  value={keywords}
                  onChange={setKeywords}
                  placeholder={t("metadataKeywordsPlaceholder")}
                />
                <Field
                  label={t("customFilename")}
                  value={customFilename}
                  onChange={setCustomFilename}
                  placeholder={computedFilename.replace(/\.pdf$/i, "")}
                />
              </div>
            </AccordionItem>
          </Accordion>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleMerge} disabled={validCount < 2 || merging} size="lg">
          {merging ? t("merging") : t("merge")}
        </Button>
        {result && (
          <>
            <Button
              variant="outline"
              onClick={() => setPreviewOpen((v) => !v)}
            >
              {previewOpen ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {previewOpen ? t("hidePreview") : t("showPreview")}
            </Button>
            <DownloadButton
              data={result}
              filename={computedFilename}
              analyticsSlug="merge"
              analyticsCategory="pdf"
            />
          </>
        )}
      </div>

      {result && (
        <p className="text-sm text-muted-foreground">
          {t("mergedSize")}: {formatFileSize(result.size)}
        </p>
      )}

      {result && previewOpen && <PdfBlobPreview blob={result} />}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

const ItemRow = memo(function ItemRow({
  item,
  index,
  total,
  disabled,
  onRemove,
  onMove,
  onToggleExpand,
  onTogglePage,
  onRotatePage,
}: {
  item: ItemState;
  index: number;
  total: number;
  disabled: boolean;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggleExpand: (id: string) => void;
  onTogglePage: (id: string, page: number) => void;
  onRotatePage: (id: string, originalIdx: number, delta: number) => void;
}) {
  const t = useTranslations("tools.pdf.merge");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 p-2">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onMove(item.id, -1)}
            disabled={index === 0 || disabled}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={t("moveUp")}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(item.id, 1)}
            disabled={index === total - 1 || disabled}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={t("moveDown")}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {item.kind === "pdf" && item.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element -- data URL preview
            <img
              src={item.thumbnail}
              alt=""
              className="h-full w-full object-contain"
            />
          )}
          {item.kind === "pdf" &&
            !item.thumbnail &&
            (item.loading ? (
              <span className="text-[10px] text-muted-foreground">
                {t("loading")}
              </span>
            ) : (
              <FileText className="h-6 w-6 text-muted-foreground" />
            ))}
          {item.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
            <img
              src={item.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          {item.kind === "blank" && (
            <div className="flex h-full w-full items-center justify-center bg-muted/60">
              <FileText className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {item.kind === "blank" ? (
            <>
              <p className="truncate text-sm font-medium">{t("blankItem")}</p>
              <p className="text-xs text-muted-foreground">
                {t("blankFollowsPrevious")}
              </p>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-medium">
                {item.file.name}
                {item.kind === "image" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <ImageIcon className="h-3 w-3" />
                    {t("imageItem")}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.kind === "pdf" && item.pageCount > 0 && (
                  <>
                    {t("selectedOf", {
                      selected: item.selectedPages.size,
                      total: item.pageCount,
                    })}
                    {" · "}
                  </>
                )}
                {item.kind === "pdf" && item.error && (
                  <span className="text-red-600">{item.error} · </span>
                )}
                {formatFileSize(item.file.size)}
              </p>
            </>
          )}
        </div>

        {item.kind === "pdf" && item.pdfDoc && (
          <button
            type="button"
            onClick={() => onToggleExpand(item.id)}
            disabled={disabled}
            aria-expanded={item.expanded}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {item.expanded ? t("collapse") : t("expand")}
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
          className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
          aria-label={t("removeFile")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {item.kind === "pdf" && item.expanded && item.pdfDoc && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {t("pageSelectHint")}
          </p>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: item.pageCount }, (_, i) => i + 1).map(
              (page) => {
                const originalIdx = page - 1;
                const rotation = item.rotations[originalIdx] ?? 0;
                return (
                  <div key={page} className="relative">
                    <PdfPagePreview
                      pdf={item.pdfDoc!}
                      pageNumber={page}
                      width={100}
                      selected={item.selectedPages.has(page)}
                      onClick={() => onTogglePage(item.id, page)}
                    />
                    <div className="absolute right-1 top-1 flex gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(item.id, originalIdx, -90);
                        }}
                        className="rounded bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                        aria-label={t("rotateLeft")}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(item.id, originalIdx, 90);
                        }}
                        className="rounded bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                        aria-label={t("rotateRight")}
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                    </div>
                    {rotation !== 0 && (
                      <div className="absolute bottom-5 left-0 right-0 bg-primary/80 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                        {rotation}°
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
});
