import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { Cog, FileInput, Download, ShieldCheck, MonitorSmartphone, Wifi, WifiOff, Layers } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "howItWorks" });

  const url = `${SITE_URL}/${locale}/how-it-works/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/how-it-works/`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/how-it-works/`]),
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
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HowItWorksUI />;
}

function HowItWorksUI() {
  const t = useTranslations("howItWorks");

  const steps = [
    { icon: FileInput, key: "select" },
    { icon: Cog, key: "process" },
    { icon: Download, key: "download" },
  ] as const;

  const techItems = [
    { icon: MonitorSmartphone, key: "canvas" },
    { icon: Layers, key: "wasm" },
    { icon: Wifi, key: "webApis" },
    { icon: WifiOff, key: "offline" },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <section className="text-center py-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
          <Cog className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          {t("subtitle")}
        </p>
      </section>

      {/* 3-step flow */}
      <section className="space-y-4">
        {steps.map(({ icon: Icon, key }, i) => (
          <div key={key} className="flex gap-4 rounded-xl border border-border p-5">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pt-1.5">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{t(`steps.${key}.title`)}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Why client-side */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">{t("whyClientSideTitle")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("whyClientSideBody")}
        </p>
      </section>

      {/* Tech under the hood */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("techTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {techItems.map(({ icon: Icon, key }) => (
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

      {/* CTA to privacy */}
      <section className="text-center py-4">
        <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {t("privacyCta")}{" "}
          <Link href="/privacy" className="text-primary hover:underline font-medium">
            {t("privacyLink")}
          </Link>
        </p>
      </section>
    </div>
  );
}
