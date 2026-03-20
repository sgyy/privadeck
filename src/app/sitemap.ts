import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getAllSlugs } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";

export const dynamic = "force-static";

const BASE_URL = "https://privadeck.app";

function buildAlternates(pathFn: (locale: string) => string) {
  return Object.fromEntries(
    locales.map((locale) => [locale, `${BASE_URL}/${locale}${pathFn(locale)}`])
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const tools = getAllSlugs();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // 首页
    entries.push({
      url: `${BASE_URL}/${locale}/`,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: { languages: buildAlternates(() => "/") },
    });

    // 工具总览
    entries.push({
      url: `${BASE_URL}/${locale}/tools/`,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: buildAlternates(() => "/tools/") },
    });

    // 分类页
    for (const cat of categories) {
      entries.push({
        url: `${BASE_URL}/${locale}/tools/${cat.key}/`,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: buildAlternates(() => `/tools/${cat.key}/`),
        },
      });
    }

    // 工具页
    for (const tool of tools) {
      entries.push({
        url: `${BASE_URL}/${locale}/tools/${tool.category}/${tool.slug}/`,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: buildAlternates(
            () => `/tools/${tool.category}/${tool.slug}/`
          ),
        },
      });
    }

    // 隐私政策
    entries.push({
      url: `${BASE_URL}/${locale}/privacy/`,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: { languages: buildAlternates(() => "/privacy/") },
    });

    // 工作原理
    entries.push({
      url: `${BASE_URL}/${locale}/how-it-works/`,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: { languages: buildAlternates(() => "/how-it-works/") },
    });
  }

  return entries;
}
