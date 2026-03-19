import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/routing";
import { getAllSlugs, getToolBySlug } from "@/lib/registry";
import { generateToolMetadata } from "@/lib/seo/metadata";
import type { ToolCategory } from "@/lib/registry/types";
import { ToolPageClient } from "./ToolPageClient";

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

  const tool = getToolBySlug(slug);
  if (!tool || tool.category !== category) {
    notFound();
  }

  return (
    <ToolPageClient
      category={category as ToolCategory}
      slug={slug}
    />
  );
}
