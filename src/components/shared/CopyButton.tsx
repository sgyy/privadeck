"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";
import { useToolAnalytics } from "@/components/tool/ToolAnalyticsContext";

export function CopyButton({
  text,
  className,
  analyticsSlug,
  analyticsCategory,
}: {
  text: string;
  className?: string;
  analyticsSlug?: string;
  analyticsCategory?: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("common");
  const ctx = useToolAnalytics();
  const slug = analyticsSlug ?? ctx?.slug;
  const category = analyticsCategory ?? ctx?.category;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (slug && category) {
      trackEvent("copy_click", { tool_slug: slug, tool_category: category });
    }
  }, [text, slug, category]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {t("copied")}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {t("copy")}
        </>
      )}
    </Button>
  );
}
