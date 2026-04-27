"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import {
  X,
  FileText,
  Image as ImageIcon,
  GripVertical,
  Plus,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils/formatFileSize";

type PdfCardData = {
  id: string;
  kind: "pdf";
  fileName: string;
  fileSize: number;
  thumbnail: string | null;
  selectedCount: number;
  pageCount: number;
  loading: boolean;
  error: string;
};

type ImageCardData = {
  id: string;
  kind: "image";
  fileName: string;
  fileSize: number;
  thumbnailUrl: string;
};

type BlankCardData = { id: string; kind: "blank" };

export type MergeCardData = PdfCardData | ImageCardData | BlankCardData;

interface MergeItemCardProps {
  data: MergeCardData;
  disabled: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export const MergeItemCard = memo(function MergeItemCard({
  data,
  disabled,
  onClick,
  onRemove,
}: MergeItemCardProps) {
  const t = useTranslations("tools.pdf.merge");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: data.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const interactive = data.kind === "pdf" && !data.loading && !data.error;

  const tooltip =
    data.kind === "blank"
      ? t("blankItem")
      : `${data.fileName} (${formatFileSize(data.fileSize)})`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={t("dragHandle")}
      title={isDragging ? undefined : tooltip}
      className={`group relative aspect-square select-none overflow-hidden rounded-lg border border-border bg-card transition-shadow focus:outline-none focus:ring-2 focus:ring-primary ${
        isDragging ? "shadow-lg" : "hover:shadow-md"
      } ${disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"} touch-none`}
    >
      {/* Card body — clickable for PDF detail. Inline button to overlay drag listener. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (interactive) onClick();
        }}
        disabled={!interactive || disabled}
        aria-label={
          data.kind === "pdf"
            ? t("viewPages")
            : data.kind === "image"
              ? t("imageItem")
              : t("blankItem")
        }
        className={`block h-full w-full ${interactive ? "cursor-pointer" : "cursor-default"} disabled:cursor-default`}
      >
        {data.kind === "pdf" && (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            {data.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL preview
              <img
                src={data.thumbnail}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-contain"
              />
            ) : data.loading ? (
              <span className="text-[10px] text-muted-foreground">
                {t("loading")}
              </span>
            ) : (
              <FileText className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
        )}
        {data.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL preview
          <img
            src={data.thumbnailUrl}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full object-cover"
          />
        )}
        {data.kind === "blank" && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted/40">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground">
              {t("blankItem")}
            </span>
          </div>
        )}
      </button>

      {/* Bottom info bar — overlay gradient (only for non-blank) */}
      {data.kind !== "blank" && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-1.5 pt-6 text-white">
          <p className="truncate text-[11px] font-medium">{data.fileName}</p>
          <p className="truncate text-[10px] opacity-80">
            {data.kind === "pdf" && data.error ? (
              <span className="text-red-300">{data.error}</span>
            ) : data.kind === "pdf" && data.pageCount > 0 ? (
              <>
                {t("selectedOf", {
                  selected: data.selectedCount,
                  total: data.pageCount,
                })}
                {" · "}
                {formatFileSize(data.fileSize)}
              </>
            ) : (
              <>
                {data.kind === "image" && (
                  <>
                    <ImageIcon className="mr-0.5 inline h-2.5 w-2.5" />
                    {t("imageItem")}
                    {" · "}
                  </>
                )}
                {formatFileSize(data.fileSize)}
              </>
            )}
          </p>
        </div>
      )}

      {/* Drag indicator (top-left, fade-in on hover) */}
      <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3 w-3" />
      </span>

      {/* Remove button (top-right, hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled}
        aria-label={t("removeFile")}
        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:hidden"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

interface AddMoreCardProps {
  accept: string;
  onAdd: (files: File[]) => void;
  disabled?: boolean;
}

export function AddMoreCard({ accept, onAdd, disabled }: AddMoreCardProps) {
  const t = useTranslations("tools.pdf.merge");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(files: File[]) {
    setDragOver(false);
    if (files.length > 0) onAdd(files);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={t("addFiles")}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (
          !(e.relatedTarget instanceof Node) ||
          !e.currentTarget.contains(e.relatedTarget)
        ) {
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (disabled) return;
        const acceptParts = accept.split(",").map((s) => s.trim());
        const dropped = Array.from(e.dataTransfer.files).filter((f) =>
          acceptParts.some((a) => {
            if (a.endsWith("/*")) return f.type.startsWith(a.slice(0, -1));
            if (a.startsWith("."))
              return f.name.toLowerCase().endsWith(a.toLowerCase());
            return f.type === a;
          }),
        );
        handleDrop(dropped);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`group/add aspect-square overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
        disabled
          ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
          : dragOver
            ? "cursor-pointer border-primary bg-primary/10 text-primary shadow-[var(--glow-primary)]"
            : "cursor-pointer border-primary/30 bg-primary/[0.03] text-primary/70 hover:border-primary/60 hover:bg-primary/[0.07] hover:text-primary"
      }`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center px-2 text-center">
        <div className="rounded-full bg-primary/10 p-2 transition-colors group-hover/add:bg-primary/15">
          <Plus className="h-5 w-5" />
        </div>
        <span className="mt-1.5 text-xs font-medium">{t("addFiles")}</span>
        <span className="mt-0.5 text-[10px] opacity-60">
          {t("addFilesHint")}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => {
          if (e.target.files) handleDrop(Array.from(e.target.files));
          e.target.value = "";
        }}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}

interface AddBlankCardProps {
  onAdd: () => void;
  disabled?: boolean;
}

export function AddBlankCard({ onAdd, disabled }: AddBlankCardProps) {
  const t = useTranslations("tools.pdf.merge");
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="group/blank aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-all duration-200 hover:border-foreground/40 hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="flex h-full w-full flex-col items-center justify-center px-2 text-center">
        <div className="rounded-full bg-muted p-2 transition-colors group-hover/blank:bg-muted/80">
          <FileText className="h-5 w-5" />
        </div>
        <span className="mt-1.5 text-xs font-medium">{t("addBlankPage")}</span>
      </div>
    </button>
  );
}

interface ClearAllCardProps {
  onClear: () => void;
  disabled?: boolean;
}

export function ClearAllCard({ onClear, disabled }: ClearAllCardProps) {
  const t = useTranslations("tools.pdf.merge");
  const [confirming, setConfirming] = useState(false);

  // Auto-revert confirming state after 3 seconds so a forgotten click doesn't
  // arm a destructive action indefinitely.
  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  return (
    <button
      type="button"
      onClick={() => {
        if (confirming) {
          onClear();
          setConfirming(false);
        } else {
          setConfirming(true);
        }
      }}
      onBlur={() => setConfirming(false)}
      disabled={disabled}
      className={`group/del aspect-square overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        confirming
          ? "border-red-500 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
          : "border-red-300/30 bg-red-50/30 text-red-400/60 hover:border-red-400/60 hover:bg-red-50/60 hover:text-red-500 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-500/40 dark:hover:border-red-700/50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      }`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center px-2 text-center">
        <div className="rounded-full bg-red-100/60 p-2 transition-colors group-hover/del:bg-red-100 dark:bg-red-900/30 dark:group-hover/del:bg-red-900/50">
          <X className="h-5 w-5" />
        </div>
        <span className="mt-1.5 px-1 text-[11px] font-medium leading-tight">
          {confirming ? t("clearAllConfirm") : t("clearAll")}
        </span>
      </div>
    </button>
  );
}
