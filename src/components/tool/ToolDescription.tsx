"use client";

import { useTranslations } from "next-intl";

const DEFAULT_SECTIONS = ["intro", "useCases", "privacy"];

interface ToolDescriptionProps {
  tool: { category: string; slug: string };
  sections?: string[];
}

function RichContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ToolDescription({ tool, sections }: ToolDescriptionProps) {
  const sectionKeys = sections ?? DEFAULT_SECTIONS;
  const t = useTranslations(`tools.${tool.category}.${tool.slug}`);
  const tc = useTranslations("common");

  // Section is rendered if its content (which is always tool-specific) exists.
  // The title may live locally or fall back to the shared common.seoContent
  // namespace (e.g. "Common Use Cases" is the same across every tool).
  const hasAnyContent = sectionKeys.some((s) => t.has(`seoContent.${s}.content`));
  if (!hasAnyContent) return null;

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-lg font-semibold">{tc("aboutThisTool")}</h2>
      {sectionKeys.map((section) => {
        if (!t.has(`seoContent.${section}.content`)) return null;
        const localTitleKey = `seoContent.${section}.title`;
        const title = t.has(localTitleKey)
          ? t(localTitleKey)
          : tc.has(`seoContent.${section}.title`)
            ? tc(`seoContent.${section}.title`)
            : null;
        if (title === null) return null;
        const content = t.raw(`seoContent.${section}.content`) as string;
        return (
          <section key={section} className="space-y-3">
            <h3 className="text-base font-semibold">{title}</h3>
            <RichContent html={content} />
          </section>
        );
      })}
    </div>
  );
}
