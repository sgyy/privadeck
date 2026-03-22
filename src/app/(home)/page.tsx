import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { loadCommonMessages, loadAllToolMessages } from "@/lib/i18n/loadMessages";
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  SITE_URL,
} from "@/lib/seo/jsonld";
import { HomeUI } from "@/components/home/HomeUI";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "home" });

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${SITE_URL}/`,
      languages: {
        "x-default": `${SITE_URL}/`,
        ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}/`])),
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE_URL}/`,
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

export default async function RootHomePage() {
  setRequestLocale("en");
  const [commonMessages, toolMessages] = await Promise.all([
    loadCommonMessages("en"),
    loadAllToolMessages("en"),
  ]);
  const orgJsonLd = generateOrganizationJsonLd();
  const siteJsonLd = generateWebSiteJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <NextIntlClientProvider locale="en" messages={{ ...commonMessages, ...toolMessages }}>
        <HomeUI />
      </NextIntlClientProvider>
    </>
  );
}
