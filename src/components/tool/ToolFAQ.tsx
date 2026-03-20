"use client";

import { useTranslations } from "next-intl";
import type { ToolDefinition } from "@/lib/registry/types";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

interface ToolFAQProps {
  tool: ToolDefinition;
}

export function ToolFAQ({ tool }: ToolFAQProps) {
  if (!tool.faq || tool.faq.length === 0) return null;

  return <ToolFAQContent tool={tool} />;
}

function ToolFAQContent({ tool }: { tool: ToolDefinition }) {
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
          <AccordionItem key={i} title={item.question}>
            {item.answer}
          </AccordionItem>
        ))}
      </Accordion>

      {/* JSON-LD for FAQ rich snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
