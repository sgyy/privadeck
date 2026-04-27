import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Shield, Cpu, Layers, Film, FileText, BadgeCheck, Globe, CloudOff, ArrowRight } from "lucide-react";
import { generateOrganizationJsonLd, SITE_URL } from "@/lib/seo/jsonld";
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
  const t = await getTranslations({ locale, namespace: "about" });

  const url = `${SITE_URL}/${locale}/about/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/about/`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/about/`]),
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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const orgJsonLd = generateOrganizationJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <AboutUI />
    </>
  );
}

function AboutUI() {
  const t = useTranslations("about");

  const techCards = [
    { icon: Cpu, key: "wasm" },
    { icon: Layers, key: "canvas" },
    { icon: Film, key: "ffmpeg" },
    { icon: FileText, key: "pdfLib" },
  ] as const;

  const statCards = [
    { icon: BadgeCheck, key: "tools" },
    { icon: Globe, key: "locales" },
    { icon: CloudOff, key: "uploads" },
    { icon: Shield, key: "clientSide" },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <section className="text-center py-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          {t("subtitle")}
        </p>
      </section>

      {/* Mission */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">{t("missionTitle")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("missionBody")}
        </p>
      </section>

      {/* Privacy promise */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">{t("promiseTitle")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("promiseBody")}
        </p>
      </section>

      {/* Tech stack */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("techTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {techCards.map(({ icon: Icon, key }) => (
            <div key={key} className="flex gap-3 rounded-lg border border-border p-4">
              <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-sm">{t(`tech.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`tech.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("statsTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium">{t(`stats.${key}`)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-border bg-primary/5 p-6 text-center">
        <h2 className="text-xl font-semibold mb-3">{t("ctaTitle")}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("ctaToolsLabel")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("ctaHowItWorksLabel")}
          </Link>
        </div>
      </section>
    </div>
  );
}
