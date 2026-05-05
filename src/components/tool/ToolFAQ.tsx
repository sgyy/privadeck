"use client";

import { useTranslations } from "next-intl";
import type { ToolDefinition } from "@/lib/registry/types";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { trackEvent } from "@/lib/analytics";

interface ToolFAQProps {
  tool: ToolDefinition;
}

export function ToolFAQ({ tool }: ToolFAQProps) {
  if (!tool.faq || tool.faq.length === 0) return null;

  return <ToolFAQContent tool={tool} />;
}

function ToolFAQContent({ tool }: { tool: ToolDefinition }) {
  // FAQ keys in registry are absolute paths and may live in the tool's own
  // namespace OR in a shared namespace (e.g. "common.sharedFaq.q3"). Use the
  // root translator so both forms resolve uniformly.
  const t = useTranslations();
  const tc = useTranslations("common");

  const faqItems = tool.faq!.map((item) => ({
    question: t(item.questionKey),
    answer: t(item.answerKey),
  }));

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">{tc("faq")}</h2>
      <Accordion className="rounded-xl border border-border bg-card px-4">
        {faqItems.map((item, i) => (
          <AccordionItem
            key={i}
            title={item.question}
            onValueChange={(isOpen) => {
              if (isOpen) {
                trackEvent("faq_expand", { tool_slug: tool.slug, tool_category: tool.category, question_index: i });
              }
            }}
          >
            {item.answer}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
