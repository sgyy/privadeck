"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { trackEvent } from "@/lib/analytics";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  maxSize?: number; // bytes
  className?: string;
  analyticsSlug?: string;
  analyticsCategory?: string;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatAccept(accept: string): string {
  return accept
    .split(",")
    .map((s) => s.trim())
    .map((s) => {
      // ".pdf" -> "PDF"
      if (s.startsWith(".")) return s.slice(1).toUpperCase();
      // "image/*" -> "Image"
      if (s.endsWith("/*")) return s.split("/")[0].charAt(0).toUpperCase() + s.split("/")[0].slice(1);
      // "image/png" -> "PNG"
      const ext = s.split("/").pop();
      return ext ? ext.toUpperCase() : s;
    })
    .join(", ");
}

export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  maxSize,
  className,
  analyticsSlug,
  analyticsCategory,
}: FileDropzoneProps) {
  const t = useTranslations("common");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      let files = Array.from(fileList);
      if (maxSize) {
        files = files.filter((f) => f.size <= maxSize);
      }
      if (files.length > 0) {
        onFiles(files);
        if (analyticsSlug && analyticsCategory) {
          const ext = files[0].name.split(".").pop()?.toLowerCase() || "unknown";
          trackEvent("file_upload", {
            tool_slug: analyticsSlug,
            tool_category: analyticsCategory,
            file_type: ext,
            file_count: files.length,
          });
        }
      }
    },
    [onFiles, maxSize, analyticsSlug, analyticsCategory],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border p-8 transition-all duration-300 hover:border-primary/50 hover:bg-muted/50 hover:shadow-[var(--glow-primary)]",
        dragging && "border-primary bg-primary/5 shadow-[var(--glow-primary-strong)]",
        className,
      )}
    >
      {/* Prominent upload button */}
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald-500 px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-[var(--glow-primary)] active:scale-[0.98]"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        <Upload className="h-4 w-4" />
        {t("uploadFiles")}
      </button>

      {/* Drag drop hint */}
      <p className="text-sm text-muted-foreground">
        {t("or")} {t("dragDrop").toLowerCase()}
      </p>

      {/* Format and size hints */}
      {(accept || maxSize) && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {accept && <span>{formatAccept(accept)}</span>}
          {accept && maxSize && <span>·</span>}
          {maxSize && (
            <span>
              {t("maxFileSize")}: {formatSize(maxSize)}
            </span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 mt-1">
        <Lock className="h-3 w-3" />
        <span>{t("privacyHint")}</span>
      </p>
    </div>
  );
}
