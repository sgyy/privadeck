"use client";

import { useCallback, useMemo } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { brandFilename } from "@/lib/brand";
import { trackEvent } from "@/lib/analytics";
import { useToolAnalytics } from "@/components/tool/ToolAnalyticsContext";

interface TextFileDownloadButtonProps {
  text: string;
  filename: string;
  mimeType?: string;
  className?: string;
  analyticsSlug?: string;
  analyticsCategory?: string;
}

export function TextFileDownloadButton({
  text,
  filename,
  mimeType = "text/plain;charset=utf-8",
  className,
  analyticsSlug,
  analyticsCategory,
}: TextFileDownloadButtonProps) {
  const t = useTranslations("common");
  const ctx = useToolAnalytics();
  const slug = analyticsSlug ?? ctx?.slug;
  const category = analyticsCategory ?? ctx?.category;

  const blob = useMemo(
    () => new Blob([text], { type: mimeType }),
    [text, mimeType],
  );

  const handleDownload = useCallback(() => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = brandFilename(filename);
    a.click();
    URL.revokeObjectURL(url);
    if (slug && category) {
      const ext = filename.split(".").pop()?.toLowerCase() || "unknown";
      trackEvent("file_download", {
        tool_slug: slug,
        tool_category: category,
        file_type: ext,
      });
    }
  }, [blob, filename, slug, category]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className={className}
    >
      <Download className="h-4 w-4" />
      {t("download")}
    </Button>
  );
}
