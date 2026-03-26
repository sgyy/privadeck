"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { formatFileSize } from "@/lib/utils/formatFileSize";
import { X, Plus } from "lucide-react";

interface ImageFileGridProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
}

export function ImageFileGrid({
  files,
  onFilesChange,
  disabled = false,
  accept = "image/*",
}: ImageFileGridProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<Map<File, { width: number; height: number }>>(new Map());
  const [addDragging, setAddDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const t = useTranslations("common");
  const addInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  useEffect(() => { filesRef.current = files; });
  const previewMapRef = useRef<Map<File, string>>(new Map());
  const dimensionsMapRef = useRef<Map<File, { width: number; height: number }>>(new Map());

  // Cleanup all preview URLs on unmount
  useEffect(() => {
    return () => {
      previewMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewMapRef.current.clear();
    };
  }, []);

  // Incrementally sync preview URLs and load dimensions for new files
  useEffect(() => {
    let cancelled = false;
    const map = previewMapRef.current;
    const dimMap = dimensionsMapRef.current;
    const currentFiles = new Set(files);
    let dimChanged = false;
    // Revoke URLs for removed files
    for (const [file, url] of map) {
      if (!currentFiles.has(file)) {
        URL.revokeObjectURL(url);
        map.delete(file);
        if (dimMap.delete(file)) dimChanged = true;
      }
    }
    // Create URLs only for new files and load their dimensions
    for (const file of files) {
      if (!map.has(file)) {
        const url = URL.createObjectURL(file);
        map.set(file, url);
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          dimMap.set(file, { width: img.naturalWidth, height: img.naturalHeight });
          setDimensions(new Map(dimMap));
        };
        img.src = url;
      }
    }
    setPreviews(files.map((f) => map.get(f)!));
    if (dimChanged) setDimensions(new Map(dimMap));
    return () => { cancelled = true; };
  }, [files]);

  function handleAdd(newFiles: File[]) {
    onFilesChange([...filesRef.current, ...newFiles]);
  }

  function removeFile(index: number) {
    setAddDragging(false);
    if (previewIndex === index) setPreviewIndex(null);
    else if (previewIndex !== null && previewIndex > index) setPreviewIndex(previewIndex - 1);
    onFilesChange(filesRef.current.filter((_, i) => i !== index));
  }

  function clearFiles() {
    setPreviewIndex(null);
    onFilesChange([]);
  }

  if (files.length === 0) {
    return (
      <FileDropzone
        accept={accept}
        multiple
        onFiles={handleAdd}
      />
    );
  }

  return (
    <>
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {files.map((file, i) => (
        <div
          key={`${file.name}-${file.size}-${i}`}
          className="group relative overflow-hidden rounded-lg border border-border bg-muted/30"
        >
          <button
            type="button"
            onClick={() => setPreviewIndex(i)}
            className="block w-full cursor-zoom-in"
          >
            <div className="aspect-square">
              {previews[i] && (
                <img
                  src={previews[i]}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </button>
          <div className="px-2 py-1.5">
            <p className="truncate text-xs font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {dimensions.get(file)
                ? `${dimensions.get(file)!.width}×${dimensions.get(file)!.height} · ${formatFileSize(file.size)}`
                : formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeFile(i)}
            disabled={disabled}
            className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:hidden"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => { if (!disabled) addInputRef.current?.click(); }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            addInputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setAddDragging(true); }}
        onDragLeave={(e) => {
          if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) {
            setAddDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setAddDragging(false);
          if (disabled) return;
          const acceptParts = accept.split(",").map((s) => s.trim());
          const dropped = Array.from(e.dataTransfer.files).filter((f) =>
            acceptParts.some((a) => {
              if (a.endsWith("/*")) return f.type.startsWith(a.slice(0, -1));
              if (a.startsWith(".")) return f.name.toLowerCase().endsWith(a.toLowerCase());
              return f.type === a;
            }),
          );
          if (dropped.length > 0) handleAdd(dropped);
        }}
        className={`group/add overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 ${
          disabled
            ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
            : addDragging
              ? "cursor-pointer border-primary bg-primary/10 text-primary shadow-[var(--glow-primary)]"
              : "cursor-pointer border-primary/30 bg-primary/[0.03] text-primary/70 hover:border-primary/60 hover:bg-primary/[0.07] hover:text-primary"
        }`}
      >
        <div className="aspect-square flex flex-col items-center justify-center px-2">
          <div className="rounded-full bg-primary/10 p-2 group-hover/add:bg-primary/15 transition-colors">
            <Plus className="h-5 w-5" />
          </div>
          <span className="mt-1.5 text-xs font-medium">{t("addMore")}</span>
          <span className="mt-0.5 text-[10px] opacity-50">{t("addMoreHint")}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={clearFiles}
        disabled={disabled}
        className="group/del cursor-pointer overflow-hidden rounded-lg border border-dashed border-red-300/30 bg-red-50/30 text-red-400/60 hover:border-red-400/60 hover:bg-red-50/60 hover:text-red-500 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-500/40 dark:hover:border-red-700/50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="aspect-square flex flex-col items-center justify-center px-2">
          <div className="rounded-full bg-red-100/60 p-2 group-hover/del:bg-red-100 dark:bg-red-900/30 dark:group-hover/del:bg-red-900/50 transition-colors">
            <X className="h-5 w-5" />
          </div>
          <span className="mt-1.5 text-xs font-medium">{t("clearAll")}</span>
        </div>
      </button>
      <input
        ref={addInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => {
          if (e.target.files) handleAdd(Array.from(e.target.files));
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>

    {previewIndex !== null && previews[previewIndex] && (
      <ImageLightbox
        src={previews[previewIndex]}
        alt={files[previewIndex]?.name ?? ""}
        onClose={() => setPreviewIndex(null)}
      />
    )}
    </>
  );
}
