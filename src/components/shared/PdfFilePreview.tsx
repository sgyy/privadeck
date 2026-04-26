"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { FileText, RefreshCw, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils/formatFileSize";

interface PdfFilePreviewProps {
  file: File;
  pageCount?: number | null;
  thumbnail?: string | null;
  disabled?: boolean;
  onReplace: (file: File) => void;
  onRemove: () => void;
  extraInfo?: React.ReactNode;
}

export function PdfFilePreview({
  file,
  pageCount,
  thumbnail,
  disabled,
  onReplace,
  onRemove,
  extraInfo,
}: PdfFilePreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tc = useTranslations("common");
  const tp = useTranslations("tools.pdf");

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL preview, optimization not applicable
          <img src={thumbnail} alt={file.name} className="h-full w-full object-contain" />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {pageCount != null && (
            <>
              {pageCount} {tp("pages")} ·{" "}
            </>
          )}
          {formatFileSize(file.size)}
          {extraInfo && <> · {extraInfo}</>}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {tc("replaceFile")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onReplace(f);
        }}
        className="hidden"
      />
    </div>
  );
}
