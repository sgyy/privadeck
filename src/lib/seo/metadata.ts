import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/routing";

const SITE_URL = "https://mediatoolbox.app";

export async function generateToolMetadata(
  locale: string,
  category: string,
  slug: string,
): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: `tools.${category}.${slug}`,
  });

  const url = `${SITE_URL}/${locale}/tools/${category}/${slug}`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t("keywords"),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [
          l,
          `${SITE_URL}/${l}/tools/${category}/${slug}`,
        ]),
      ),
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url,
      type: "website",
      siteName: "Media Toolbox",
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

  const url = `${SITE_URL}/${locale}/tools/${category}`;

  return {
    title: t("name"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/tools/${category}`]),
      ),
    },
  };
}
