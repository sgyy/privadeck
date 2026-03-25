"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { formatFileSize } from "@/lib/utils/formatFileSize";
import { ImageIcon, RefreshCw, X } from "lucide-react";

interface SingleImageUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  analyticsSlug?: string;
  analyticsCategory?: string;
}

interface PreviewState {
  url: string;
  dimensions: { width: number; height: number } | null;
  error: boolean;
}

export function SingleImageUpload({
  file,
  onFileChange,
  accept = "image/*",
  maxSize,
  disabled = false,
  className,
  analyticsSlug,
  analyticsCategory,
}: SingleImageUploadProps) {
  const t = useTranslations("common");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const activeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      const dims = img.naturalWidth > 0 && img.naturalHeight > 0
        ? { width: img.naturalWidth, height: img.naturalHeight }
        : null;
      // Revoke old URL only after new preview is ready (no flicker)
      if (activeUrlRef.current && activeUrlRef.current !== url) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
      activeUrlRef.current = url;
      setPreview({ url, dimensions: dims, error: false });
    };
    img.onerror = () => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      if (activeUrlRef.current && activeUrlRef.current !== url) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
      activeUrlRef.current = url;
      setPreview({ url, dimensions: null, error: true });
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleReplace = useCallback(() => {
    replaceInputRef.current?.click();
  }, []);

  if (!file) {
    return (
      <FileDropzone
        accept={accept}
        maxSize={maxSize}
        onFiles={(files) => onFileChange(files[0] ?? null)}
        className={className}
        analyticsSlug={analyticsSlug}
        analyticsCategory={analyticsCategory}
      />
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
      {/* Thumbnail */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {preview?.url && !preview.error ? (
          <img
            src={preview.url}
            alt={file.name}
            className="h-full w-full object-cover"
            onError={() => setPreview((p) => p ? { ...p, error: true } : p)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {preview?.dimensions ? `${preview.dimensions.width}×${preview.dimensions.height} · ` : ""}
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={handleReplace}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("replaceFile")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onFileChange(null)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && !(maxSize && f.size > maxSize)) {
            onFileChange(f);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
