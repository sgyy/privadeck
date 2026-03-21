"use client";

import { useTranslations } from "next-intl";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

const DEFAULT_SECTIONS = ["intro", "howToUse", "features", "useCases", "privacy"];

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

  // Check if seoContent exists by trying to access first section
  let hasSeoContent = false;
  try {
    t.raw(`seoContent.${sectionKeys[0]}.title`);
    hasSeoContent = true;
  } catch {
    // No seoContent available
  }

  if (!hasSeoContent) return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">{tc("aboutThisTool")}</h2>
      <Accordion className="rounded-xl border border-border bg-card px-4">
        {sectionKeys.map((section) => (
          <AccordionItem key={section} title={t(`seoContent.${section}.title`)}>
            <RichContent html={t.raw(`seoContent.${section}.content`)} />
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
