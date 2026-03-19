import type { ToolDefinition } from "@/lib/registry/types";

const SITE_URL = "https://mediatoolbox.app";

export function generateToolJsonLd(
  tool: ToolDefinition,
  locale: string,
  name: string,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": tool.seo.structuredDataType,
    name,
    description,
    url: `${SITE_URL}/${locale}/tools/${tool.category}/${tool.slug}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function generateFaqJsonLd(
  faqItems: { question: string; answer: string }[],
) {
  if (faqItems.length === 0) return null;

  return {
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
  };
}
