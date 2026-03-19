"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface DownloadButtonProps {
  data: Blob | string; // Blob or data URL
  filename: string;
  className?: string;
}

export function DownloadButton({
  data,
  filename,
  className,
}: DownloadButtonProps) {
  const t = useTranslations("common");

  const handleDownload = useCallback(() => {
    const url =
      typeof data === "string" ? data : URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    if (typeof data !== "string") {
      URL.revokeObjectURL(url);
    }
  }, [data, filename]);

  return (
    <Button onClick={handleDownload} className={className}>
      <Download className="h-4 w-4" />
      {t("download")}
    </Button>
  );
}
