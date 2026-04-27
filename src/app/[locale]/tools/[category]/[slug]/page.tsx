import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/routing";
import { getAllSlugs, getToolBySlug } from "@/lib/registry";
import { generateToolMetadata } from "@/lib/seo/metadata";
import type { ToolCategory } from "@/lib/registry/types";
import { loadCommonMessages, loadCategoryMessages } from "@/lib/i18n/loadMessages";
import { ToolPageClient } from "./ToolPageClient";
import { getTranslations } from "next-intl/server";
import { generateToolJsonLd, generateFaqJsonLd, generateBreadcrumbJsonLd, SITE_URL } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  const slugs = getAllSlugs();
  const params = [];
  for (const locale of locales) {
    for (const { category, slug } of slugs) {
      params.push({ locale, category, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  return generateToolMetadata(locale, category, slug);
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  setRequestLocale(locale);

  const tool = getToolBySlug(slug, category as ToolCategory);
  if (!tool) {
    notFound();
  }

  const [commonMessages, catMessages] = await Promise.all([
    loadCommonMessages(locale),
    loadCategoryMessages(locale, category),
  ]);
  // Merge common messages with single tool's translations
  const messages = {
    ...commonMessages,
    tools: { [category]: { [slug]: catMessages.tools?.[category]?.[slug] ?? {} } },
  };

  const needsFFmpeg = category === "video" || category === "audio";

  const tt = await getTranslations({ locale, namespace: `tools.${category}.${slug}` });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const tc = await getTranslations({ locale, namespace: "categories" });

  const toolJsonLd = generateToolJsonLd(tool, locale, tt("name"), tt("description"));

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: tn("home"), url: `${SITE_URL}/${locale}/` },
    { name: tn("tools"), url: `${SITE_URL}/${locale}/tools/` },
    { name: tc(`${category}.name`), url: `${SITE_URL}/${locale}/tools/${category}/` },
    { name: tt("name"), url: `${SITE_URL}/${locale}/tools/${category}/${slug}/` },
  ]);

  const faqCount = tool.faq?.length ?? 0;
  const faqItems = [];
  for (let i = 1; i <= faqCount; i++) {
    const q = tt.has(`faq.q${i}`) ? tt(`faq.q${i}`) : null;
    const a = tt.has(`faq.a${i}`) ? tt(`faq.a${i}`) : null;
    if (q && a) faqItems.push({ question: q, answer: a });
  }
  const faqJsonLd = generateFaqJsonLd(faqItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {needsFFmpeg && (
        <>
          <link rel="prefetch" href="https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js" crossOrigin="anonymous" />
          <link rel="prefetch" href="https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm" crossOrigin="anonymous" />
        </>
      )}
      <NextIntlClientProvider messages={messages}>
        <ToolPageClient
          category={category as ToolCategory}
          slug={slug}
        />
      </NextIntlClientProvider>
    </>
  );
}
