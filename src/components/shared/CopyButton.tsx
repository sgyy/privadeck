"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

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

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (analyticsSlug && analyticsCategory) {
      trackEvent("copy_click", { tool_slug: analyticsSlug, tool_category: analyticsCategory });
    }
  }, [text, analyticsSlug, analyticsCategory]);

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
