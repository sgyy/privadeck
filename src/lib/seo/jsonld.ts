import type { ToolDefinition } from "@/lib/registry/types";

export const SITE_URL = "https://privadeck.app";

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
    url: `${SITE_URL}/${locale}/tools/${tool.category}/${tool.slug}/`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    browserRequirements: "Modern browser with JavaScript and WebAssembly",
    permissions: "none",
    author: {
      "@type": "Organization",
      name: "PrivaDeck",
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PrivaDeck",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512x512.png`,
    description:
      "Privacy-first browser-based tools for media, PDF, and developer tasks. 100% local processing.",
  };
}

export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PrivaDeck",
    url: SITE_URL,
    description:
      "Free browser-based media tools. No uploads, no signups, 100% private.",
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
