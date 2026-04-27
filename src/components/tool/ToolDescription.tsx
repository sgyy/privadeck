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

  // Check if seoContent exists
  if (!t.has(`seoContent.${sectionKeys[0]}.title`)) return null;

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-lg font-semibold">{tc("aboutThisTool")}</h2>
      {sectionKeys.map((section) => {
        if (!t.has(`seoContent.${section}.title`)) return null;
        const title = t(`seoContent.${section}.title`);
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
