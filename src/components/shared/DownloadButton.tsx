"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { brandFilename } from "@/lib/brand";
import { trackEvent } from "@/lib/analytics";

interface DownloadButtonProps {
  data: Blob | string; // Blob or data URL
  filename: string;
  className?: string;
  analyticsSlug?: string;
  analyticsCategory?: string;
}

export function DownloadButton({
  data,
  filename,
  className,
  analyticsSlug,
  analyticsCategory,
}: DownloadButtonProps) {
  const t = useTranslations("common");

  const handleDownload = useCallback(() => {
    const url =
      typeof data === "string" ? data : URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = brandFilename(filename);
    a.click();
    if (typeof data !== "string") {
      URL.revokeObjectURL(url);
    }
    if (analyticsSlug && analyticsCategory) {
      const ext = filename.split(".").pop()?.toLowerCase() || "unknown";
      trackEvent("file_download", {
        tool_slug: analyticsSlug,
        tool_category: analyticsCategory,
        file_type: ext,
      });
    }
  }, [data, filename, analyticsSlug, analyticsCategory]);

  return (
    <Button onClick={handleDownload} className={className}>
      <Download className="h-4 w-4" />
      {t("download")}
    </Button>
  );
}
