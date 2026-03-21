import { setRequestLocale } from "next-intl/server";
import { useTranslations, NextIntlClientProvider } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getToolsByCategory } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { locales } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { generateCategoryMetadata } from "@/lib/seo/metadata";
import type { ToolCategory } from "@/lib/registry/types";
import { loadCommonMessages, loadCategoryMessages } from "@/lib/i18n/loadMessages";
import { getTranslations } from "next-intl/server";
import { generateBreadcrumbJsonLd, SITE_URL } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  const params = [];
  for (const locale of locales) {
    for (const cat of categories) {
      params.push({ locale, category: cat.key });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  return generateCategoryMetadata(locale, category);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const [commonMessages, toolMessages] = await Promise.all([
    loadCommonMessages(locale),
    loadCategoryMessages(locale, category),
  ]);

  const t = await getTranslations({ locale, namespace: "common" });
  const tc = await getTranslations({ locale, namespace: "categories" });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: t("nav.home"), url: `${SITE_URL}/${locale}/` },
    { name: tc(`${category}.name`), url: `${SITE_URL}/${locale}/tools/${category}/` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <NextIntlClientProvider messages={{ ...commonMessages, ...toolMessages }}>
        <CategoryPageUI category={category as ToolCategory} />
      </NextIntlClientProvider>
    </>
  );
}

function CategoryPageUI({ category }: { category: ToolCategory }) {
  const tc = useTranslations("categories");
  const tt = useTranslations("tools");
  const tCommon = useTranslations("common");
  const tools = getToolsByCategory(category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {tc(`${category}.name`)}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {tc(`${category}.description`)}
        </p>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
        {tCommon(`categoryIntro.${category}`)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.slug} href={`/tools/${category}/${tool.slug}`}>
            <Card className="p-4 transition-colors hover:bg-muted/50 h-full">
              <h3 className="font-medium">
                {tt(`${category}.${tool.slug}.name`)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {tt(`${category}.${tool.slug}.description`)}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
