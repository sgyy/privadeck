"use client";

import { useCallback, useState, useRef } from "react";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  maxSize?: number; // bytes
  className?: string;
}

export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  maxSize,
  className,
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
      }
    },
    [onFiles, maxSize],
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
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-muted/50",
        dragging && "border-primary bg-accent",
        className,
      )}
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium">{t("dragDrop")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("or")}{" "}
          <span className="text-primary underline">{t("browseFiles")}</span>
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
