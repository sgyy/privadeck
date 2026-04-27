"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/Dialog";

interface PdfFullscreenPreviewProps {
  blob: Blob | null;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfFullscreenPreview({
  blob,
  title,
  open,
  onOpenChange,
}: PdfFullscreenPreviewProps) {
  const t = useTranslations("common");
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob || !open) return;
    const u = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- blob URL must be created and revoked together
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      // Drop the stale reference so a re-open with a new blob doesn't render
      // a freed URL for the first frame before the new effect runs.
      setUrl(null);
    };
  }, [blob, open]);

  if (!open || !url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/85" />
      <DialogContent className="p-0 sm:p-4">
        <div
          style={{ width: "min(95vw, 1400px)", height: "92vh" }}
          className="relative flex flex-col overflow-hidden rounded-lg bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <DialogTitle className="truncate text-sm font-semibold sm:text-base">
              {title ?? "PDF Preview"}
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t("close")}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            key={url}
            src={`${url}#page=1&zoom=auto`}
            title={title ?? "PDF Preview"}
            className="h-full w-full flex-1 bg-muted"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
