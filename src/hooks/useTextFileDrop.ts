"use client";

import { useState, useCallback, useRef, useEffect, type DragEvent } from "react";

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPT = [
  ".txt", ".json", ".csv", ".xml", ".yaml", ".yml", ".md",
  ".html", ".css", ".js", ".ts", ".tsx", ".jsx", ".svg",
  ".log", ".ini", ".cfg", ".toml", ".env", ".sh", ".bat",
];

export function useTextFileDrop(
  onTextLoaded: (text: string, filename: string) => void,
  options?: { accept?: string[]; maxSizeBytes?: number },
) {
  const [isDragging, setIsDragging] = useState(false);

  const accept = options?.accept ?? DEFAULT_ACCEPT;
  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE;

  // Stable ref to avoid recreating onDrop on every render
  const callbackRef = useRef(onTextLoaded);
  useEffect(() => {
    callbackRef.current = onTextLoaded;
  }, [onTextLoaded]);

  const onDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [],
  );

  const onDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const currentTarget = e.currentTarget as HTMLElement;
      if (currentTarget.contains(e.relatedTarget as Node)) return;
      setIsDragging(false);
    },
    [],
  );

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (accept.length > 0 && !accept.includes(ext)) return;
      if (file.size > maxSize) return;

      try {
        const text = await file.text();
        callbackRef.current(text, file.name);
      } catch {
        // silently ignore read errors
      }
    },
    [accept, maxSize],
  );

  return {
    isDragging,
    dragHandlers: { onDragOver, onDragLeave, onDrop },
  };
}
