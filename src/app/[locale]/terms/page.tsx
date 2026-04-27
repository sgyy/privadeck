import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { FileText } from "lucide-react";
import { SITE_URL } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  const url = `${SITE_URL}/${locale}/terms/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/terms/`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/terms/`]),
        ),
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      type: "website",
      siteName: "PrivaDeck",
      images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: "PrivaDeck - Privacy-First Online Tools" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${SITE_URL}/og-default.png`],
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsUI />;
}

function TermsUI() {
  const t = useTranslations("terms");

  const sections = [
    "acceptance",
    "license",
    "warranty",
    "liability",
    "changes",
    "governing",
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <section className="text-center py-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          {t("subtitle")}
        </p>
      </section>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((key, idx) => (
          <section key={key} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">
              {idx + 1}. {t(`sections.${key}.title`)}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>

      {/* Last updated */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        {t("lastUpdated")}
      </p>
    </div>
  );
}
