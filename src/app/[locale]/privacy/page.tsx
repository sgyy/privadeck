import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { Shield, Eye, EyeOff, HardDrive, Lock, FileX } from "lucide-react";
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
  const t = await getTranslations({ locale, namespace: "privacy" });

  const url = `${SITE_URL}/${locale}/privacy/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/privacy/`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/privacy/`]),
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

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyUI />;
}

function PrivacyUI() {
  const t = useTranslations("privacy");

  const features = [
    { icon: EyeOff, key: "noUpload" },
    { icon: HardDrive, key: "localStorage" },
    { icon: Lock, key: "openSource" },
    { icon: FileX, key: "noLogs" },
    { icon: Eye, key: "transparent" },
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

      {/* Core promise */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">{t("corePromiseTitle")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("corePromiseBody")}
        </p>
      </section>

      {/* Feature grid */}
      <section className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, key }) => (
          <div key={key} className="flex gap-3 rounded-lg border border-border p-4">
            <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-sm">{t(`features.${key}.title`)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`features.${key}.description`)}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("howItWorksTitle")}</h2>
        <div className="space-y-3">
          {([1, 2, 3] as const).map((step) => (
            <div key={step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {step}
              </span>
              <div>
                <h3 className="font-medium text-sm">{t(`steps.step${step}.title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`steps.step${step}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Third-party */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-2">{t("thirdPartyTitle")}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("thirdPartyBody")}
        </p>
      </section>

      {/* Last updated */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        {t("lastUpdated")}
      </p>
    </div>
  );
}
