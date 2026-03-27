"use client";

import { useTranslations } from "next-intl";

interface ToolWhySectionProps {
  tool: { category: string; slug: string };
}

export function ToolWhySection({ tool }: ToolWhySectionProps) {
  const t = useTranslations(`tools.${tool.category}.${tool.slug}`);

  if (!t.has("whySection.title")) return null;
  const title = t("whySection.title");
  const content = t.raw("whySection.content") as string;

  return (
    <div className="mt-8 space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
