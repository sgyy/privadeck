"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PdfPagePreviewProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  accentClassName?: string;
  badge?: string;
}

export function PdfPagePreview({
  pdf,
  pageNumber,
  width = 150,
  selected,
  onClick,
  className,
  accentClassName,
  badge,
}: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 1 });
      const scale = width / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs-dist v5 render() requires canvas prop not in type defs
      await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as any).promise;
      if (!cancelled) setLoading(false);
    }
    render().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [pdf, pageNumber, width]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative inline-block rounded-lg border-2 overflow-hidden transition-all",
        onClick ? "cursor-pointer" : "cursor-default",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : accentClassName
            ? accentClassName
            : "border-border hover:border-primary/50",
        className,
      )}
    >
      {loading && (
        <div
          className="flex items-center justify-center bg-muted animate-pulse"
          style={{ width, height: width * 1.4 }}
        >
          <span className="text-xs text-muted-foreground">{pageNumber}</span>
        </div>
      )}
      <canvas ref={canvasRef} className={loading ? "hidden" : "block"} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-xs text-white">
        {pageNumber}
      </div>
      {badge && (
        <div className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </div>
      )}
    </div>
  );
}
