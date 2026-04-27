"use client";

import { useEffect, useState } from "react";

interface PdfBlobPreviewProps {
  blob: Blob;
  height?: number;
  className?: string;
}

export function PdfBlobPreview({
  blob,
  height = 600,
  className,
}: PdfBlobPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [blob]);

  if (!url) return null;

  return (
    <iframe
      src={url}
      title="Merged PDF preview"
      className={className ?? "w-full rounded-lg border border-border bg-muted"}
      style={{ height: `${height}px` }}
    />
  );
}
