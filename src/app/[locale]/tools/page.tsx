import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations, NextIntlClientProvider } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { locales } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { loadCommonMessages, loadAllToolMessages } from "@/lib/i18n/loadMessages";
import { generateBreadcrumbJsonLd, SITE_URL } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export function generateStaticParams() {
// ... (rest of imports and generateStaticParams)
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "allTools" });

  const url = `${SITE_URL}/${locale}/tools/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/tools/`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/tools/`]),
        ),
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      type: "website",
      siteName: "PrivaDeck",
      images: [
        {
          url: `${SITE_URL}/og-default.png`,
          width: 1200,
          height: 630,
          alt: "PrivaDeck - Privacy-First Online Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${SITE_URL}/og-default.png`],
    },
  };
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [commonMessages, toolMessages] = await Promise.all([
    loadCommonMessages(locale),
    loadAllToolMessages(locale),
  ]);

  const tn = await getTranslations({ locale, namespace: "nav" });
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: tn("home"), url: `${SITE_URL}/${locale}/` },
    { name: tn("tools"), url: `${SITE_URL}/${locale}/tools/` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <NextIntlClientProvider messages={{ ...commonMessages, ...toolMessages }}>
        <ToolsPageUI />
      </NextIntlClientProvider>
    </>
  );
}

function ToolsPageUI() {
  const t = useTranslations("nav");
  const tc = useTranslations("categories");
  const tt = useTranslations("tools");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("tools")}
      </h1>

      {categories.map((cat) => {
        const tools = getAllTools().filter((tool) => tool.category === cat.key);

        return (
          <section key={cat.key}>
            <h2 className="mb-4 text-lg font-semibold">
              {tc(`${cat.key}.name`)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.category}/${tool.slug}`}
                >
                  <Card className="p-4 transition-colors hover:bg-muted/50 h-full">
                    <h3 className="font-medium">
                      {tt(`${tool.category}.${tool.slug}.name`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {tt(`${tool.category}.${tool.slug}.description`)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
