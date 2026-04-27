"use client";

import { useTranslations } from "next-intl";
import { X, RotateCcw, RotateCw } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PdfPagePreview } from "@/components/shared/PdfPagePreview";
import { formatFileSize } from "@/lib/utils/formatFileSize";

interface PdfDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileSize: number;
  pageCount: number;
  pdfDoc: PDFDocumentProxy;
  selectedPages: Set<number>;
  rotations: Record<number, number>;
  onTogglePage: (page: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRotatePage: (originalIdx: number, delta: number) => void;
}

export function PdfDetailDialog({
  open,
  onOpenChange,
  fileName,
  fileSize,
  pageCount,
  pdfDoc,
  selectedPages,
  rotations,
  onTogglePage,
  onSelectAll,
  onDeselectAll,
  onRotatePage,
}: PdfDetailDialogProps) {
  const t = useTranslations("tools.pdf.merge");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80" />
      <DialogContent className="p-0 sm:p-4">
        <div
          style={{ width: "min(95vw, 1200px)", height: "90vh" }}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-semibold sm:text-lg">
                {fileName}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("selectedOf", {
                  selected: selectedPages.size,
                  total: pageCount,
                })}
                {" · "}
                {formatFileSize(fileSize)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onSelectAll}>
                {t("selectAllPages")}
              </Button>
              <Button size="sm" variant="ghost" onClick={onDeselectAll}>
                {t("deselectAllPages")}
              </Button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t("closeDetail")}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Hint */}
          <div className="border-b border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6">
            {t("pageSelectHint")}
          </div>

          {/* Page grid (scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                (page) => {
                  const originalIdx = page - 1;
                  const rotation = rotations[originalIdx] ?? 0;
                  return (
                    <div key={page} className="group relative">
                      <PdfPagePreview
                        pdf={pdfDoc}
                        pageNumber={page}
                        width={150}
                        selected={selectedPages.has(page)}
                        onClick={() => onTogglePage(page)}
                      />
                      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRotatePage(originalIdx, -90);
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
                            onRotatePage(originalIdx, 90);
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
