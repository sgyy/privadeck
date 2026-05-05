import type { ToolDefinition } from "@/lib/registry/types";

export const SITE_URL = "https://privadeck.app";

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateToolJsonLd(
  tool: ToolDefinition,
  locale: string,
  name: string,
  description: string,
  extras?: {
    featureList?: string[];
    keywords?: string;
    longDescription?: string;
  },
) {
  const url = `${SITE_URL}/${locale}/tools/${tool.category}/${tool.slug}/`;
  const finalDescription = extras?.longDescription || description;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": tool.seo.structuredDataType,
    name,
    description: finalDescription,
    url,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    browserRequirements: "Modern browser with JavaScript and WebAssembly",
    permissions: "none",
    isAccessibleForFree: true,
    inLanguage: locale,
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
    softwareHelp: {
      "@type": "CreativeWork",
      url: `${url}#about-this-tool`,
    },
  };

  if (extras?.featureList && extras.featureList.length > 0) {
    schema.featureList = extras.featureList;
  }
  if (extras?.keywords) {
    schema.keywords = extras.keywords;
  }

  return schema;
}

export function generateAboutArticleJsonLd(
  tool: ToolDefinition,
  locale: string,
  toolName: string,
  aboutTitle: string,
  articleBody: string,
) {
  const pageUrl = `${SITE_URL}/${locale}/tools/${tool.category}/${tool.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${aboutTitle}: ${toolName}`,
    articleSection: aboutTitle,
    articleBody,
    inLanguage: locale,
    mainEntityOfPage: `${pageUrl}#about-this-tool`,
    author: {
      "@type": "Organization",
      name: "PrivaDeck",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "PrivaDeck",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/icon-512x512.png`,
      },
    },
    about: {
      "@type": tool.seo.structuredDataType,
      name: toolName,
      url: pageUrl,
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

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
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
