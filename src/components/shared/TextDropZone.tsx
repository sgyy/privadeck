"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { useTextFileDrop } from "@/hooks/useTextFileDrop";

interface TextDropZoneProps {
  onTextLoaded: (text: string, filename: string) => void;
  accept?: string[];
  isEmpty?: boolean;
  children: (props: {
    isDragging: boolean;
    dropClassName: string;
  }) => ReactNode;
}

/**
 * Wraps a raw <textarea> with drag-and-drop file support and visual feedback.
 * Used by dual-column tools that don't use the TextArea component.
 */
export function TextDropZone({ onTextLoaded, accept, isEmpty, children }: TextDropZoneProps) {
  const tc = useTranslations("common");
  const drop = useTextFileDrop(onTextLoaded, accept ? { accept } : undefined);

  const dropClassName = drop.isDragging ? "ring-2 ring-primary border-primary" : "";

  return (
    <div className="relative" {...drop.dragHandlers}>
      {children({ isDragging: drop.isDragging, dropClassName })}
      {drop.isDragging && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 backdrop-blur-[1px] pointer-events-none">
          <span className="text-sm font-medium text-primary">{tc("dropTextFile")}</span>
        </div>
      )}
      {isEmpty && !drop.isDragging && (
        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
          <Upload className="h-3 w-3" />
          {tc("dropTextFileHint")}
        </div>
      )}
    </div>
  );
}
