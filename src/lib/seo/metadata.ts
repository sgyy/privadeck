import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";

const SITE_URL = "https://privadeck.app";

const OG_IMAGE = {
  url: `${SITE_URL}/og-default.png`,
  width: 1200,
  height: 630,
  alt: "PrivaDeck - Privacy-First Online Tools",
};

export async function generateToolMetadata(
  locale: string,
  category: string,
  slug: string,
): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: `tools.${category}.${slug}`,
  });

  const url = `${SITE_URL}/${locale}/tools/${category}/${slug}/`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t("keywords"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/tools/${category}/${slug}/`,
        ...Object.fromEntries(
          locales.map((l) => [
            l,
            `${SITE_URL}/${l}/tools/${category}/${slug}/`,
          ]),
        ),
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      type: "website",
      siteName: "PrivaDeck",
      images: [OG_IMAGE],
    },
  };
}

export async function generateCategoryMetadata(
  locale: string,
  category: string,
): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: `categories.${category}`,
  });

  const url = `${SITE_URL}/${locale}/tools/${category}/`;

  return {
    title: t("name"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: {
        "x-default": `${SITE_URL}/en/tools/${category}/`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/tools/${category}/`]),
        ),
      },
    },
    openGraph: {
      title: t("name"),
      description: t("description"),
      url,
      type: "website",
      siteName: "PrivaDeck",
      images: [OG_IMAGE],
    },
  };
}
