"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { PdfFullscreenPreview } from "@/components/shared/PdfFullscreenPreview";
import { Button } from "@/components/ui/Button";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { getPdfPreview } from "@/lib/pdf/getPdfPreview";
import { createToolTracker } from "@/lib/analytics";
import { mergeItems, formatFileSize, type MergeItem } from "./logic";
import {
  MergeItemCard,
  AddMoreCard,
  AddBlankCard,
  ClearAllCard,
  type MergeCardData,
} from "./MergeItemCard";
import { PdfDetailDialog } from "./PdfDetailDialog";

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
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

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

  // Drag-and-drop sensors. distance:5 prevents nested clicks (X / detail) from
  // accidentally entering a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      for (const it of itemsRef.current) {
        if (it.kind === "pdf") it.pdfDoc?.destroy();
        if (it.kind === "image") URL.revokeObjectURL(it.thumbnailUrl);
      }
    };
  }, []);

  // Auto-close detail dialog if its item is removed externally (e.g. clearAll).
  useEffect(() => {
    if (!detailItemId) return;
    if (!items.find((it) => it.id === detailItemId)) {
      setDetailItemId(null);
    }
  }, [items, detailItemId]);

  const handleFiles = useCallback((files: File[]) => {
    setError("");
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
          { thumbnailWidth: 200 },
        );
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
    setError("");
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

  const selectAllPagesForItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id || it.kind !== "pdf") return it;
        return {
          ...it,
          selectedPages: new Set(
            Array.from({ length: it.pageCount }, (_, i) => i + 1),
          ),
        };
      }),
    );
    setResult(null);
  }, []);

  const deselectAllPagesForItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id || it.kind !== "pdf") return it;
        return { ...it, selectedPages: new Set<number>() };
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

  const insertBlankAtEnd = useCallback(() => {
    setItems((prev) => [...prev, { id: uid(), kind: "blank" }]);
    setSortMode("manual");
    setResult(null);
    setError("");
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
    setPreviewOpen(false);
    setDetailItemId(null);
  }, []);

  const applySort = useCallback((mode: SortMode) => {
    setSortMode(mode);
    setError("");
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((it) => it.id === active.id);
      const newIdx = prev.findIndex((it) => it.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
    setSortMode("manual");
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

  const detailItem = useMemo(() => {
    if (!detailItemId) return null;
    const it = items.find((x) => x.id === detailItemId);
    if (!it || it.kind !== "pdf" || !it.pdfDoc) return null;
    return it;
  }, [items, detailItemId]);

  const handleMerge = useCallback(async () => {
    if (mergingRef.current) return;
    const currentItems = itemsRef.current;
    const valid = currentItems.filter((it) => {
      if (it.kind === "pdf")
        return !it.loading && !it.error && it.selectedPages.size > 0;
      return true;
    });
    if (valid.length < 2) return;

    mergingRef.current = true;
    setMerging(true);
    setError("");
    setResult(null);
    setPreviewOpen(false);
    const start = Date.now();

    try {
      const ready: MergeItem[] = valid.map((it) => {
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
  }, [title, author, subject, keywords]);

  const computedFilename = useMemo(() => {
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

  const itemIds = useMemo(() => items.map((it) => it.id), [items]);

  const cardData: MergeCardData[] = useMemo(
    () =>
      items.map((it) => {
        if (it.kind === "pdf") {
          return {
            id: it.id,
            kind: "pdf",
            fileName: it.file.name,
            fileSize: it.file.size,
            thumbnail: it.thumbnail,
            selectedCount: it.selectedPages.size,
            pageCount: it.pageCount,
            loading: it.loading,
            error: it.error,
          };
        }
        if (it.kind === "image") {
          return {
            id: it.id,
            kind: "image",
            fileName: it.file.name,
            fileSize: it.file.size,
            thumbnailUrl: it.thumbnailUrl,
          };
        }
        return { id: it.id, kind: "blank" };
      }),
    [items],
  );

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <FileDropzone
          accept={ACCEPT}
          multiple
          onFiles={handleFiles}
          analyticsSlug="merge"
          analyticsCategory="pdf"
        />
      ) : (
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
            <span className="ms-auto text-[11px] text-muted-foreground">
              {t("dragHint")}
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {cardData.map((c) => (
                  <MergeItemCard
                    key={c.id}
                    data={c}
                    disabled={merging}
                    onClick={() => setDetailItemId(c.id)}
                    onRemove={() => removeItem(c.id)}
                  />
                ))}
                <AddMoreCard
                  accept={ACCEPT}
                  onAdd={handleFiles}
                  disabled={merging}
                />
                <AddBlankCard onAdd={insertBlankAtEnd} disabled={merging} />
                <ClearAllCard onClear={clearAll} disabled={merging} />
              </div>
            </SortableContext>
          </DndContext>

          <Accordion>
            <AccordionItem title={t("advancedOptions")}>
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
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
                  className="sm:col-span-2"
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
        <Button
          onClick={handleMerge}
          disabled={validCount < 2 || merging}
          size="lg"
        >
          {merging ? t("merging") : t("merge")}
        </Button>
        {result && (
          <>
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
              {t("previewFullscreen")}
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

      {detailItem && (
        <PdfDetailDialog
          open={!!detailItemId}
          onOpenChange={(o) => !o && setDetailItemId(null)}
          fileName={detailItem.file.name}
          fileSize={detailItem.file.size}
          pageCount={detailItem.pageCount}
          pdfDoc={detailItem.pdfDoc!}
          selectedPages={detailItem.selectedPages}
          rotations={detailItem.rotations}
          onTogglePage={(p) => togglePage(detailItem.id, p)}
          onSelectAll={() => selectAllPagesForItem(detailItem.id)}
          onDeselectAll={() => deselectAllPagesForItem(detailItem.id)}
          onRotatePage={(idx, delta) => rotatePage(detailItem.id, idx, delta)}
        />
      )}

      <PdfFullscreenPreview
        blob={result}
        title={computedFilename}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
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
