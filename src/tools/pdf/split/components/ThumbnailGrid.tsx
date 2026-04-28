"use client";

import { useTranslations } from "next-intl";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfPagePreview } from "@/components/shared/PdfPagePreview";
import { pageColor, type ModeContext } from "../colors";
import type { SplitMode } from "../logic";

interface ThumbnailGridProps {
  pdf: PDFDocumentProxy;
  pageCount: number;
  mode: SplitMode;
  modeContext: ModeContext;
  editingRangeStart: number | null;
  onPageClickForRange?: (page: number) => void;
}

export function ThumbnailGrid({
  pdf,
  pageCount,
  mode,
  modeContext,
  editingRangeStart,
  onPageClickForRange,
}: ThumbnailGridProps) {
  const t = useTranslations("tools.pdf.split.preview");
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const isRangeMode = mode === "range";

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("color")}</p>
      <div className="flex flex-wrap gap-3">
        {pages.map((page) => {
          const accent = pageColor(page, modeContext);
          const isStart = isRangeMode && editingRangeStart === page;
          return (
            <PdfPagePreview
              key={page}
              pdf={pdf}
              pageNumber={page}
              width={110}
              accentClassName={accent}
              selected={isStart}
              onClick={
                isRangeMode && onPageClickForRange
                  ? () => onPageClickForRange(page)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
