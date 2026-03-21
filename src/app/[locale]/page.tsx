import { useTranslations } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { locales } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield, Zap, Globe } from "lucide-react";
import { loadCommonMessages, loadAllToolMessages } from "@/lib/i18n/loadMessages";
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  SITE_URL,
} from "@/lib/seo/jsonld";
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
  const t = await getTranslations({ locale, namespace: "home" });

  const url = `${SITE_URL}/${locale}/`;

  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/`]),
      ),
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
  };
}

export default async function HomePage({
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
      <NextIntlClientProvider messages={{ ...commonMessages, ...toolMessages }}>
        <HomeUI />
      </NextIntlClientProvider>
    </>
  );
}

const decks = [
  { titleKey: "mediaDeck" as const, categories: ["image", "video", "audio"] as const },
  { titleKey: "pdfDeck" as const, categories: ["pdf"] as const },
  { titleKey: "devDeck" as const, categories: ["developer"] as const },
];

const metaDeckSlugs = ["remove-exif", "hash-generator", "archive"] as const;

function HomeUI() {
  const t = useTranslations("home");
  const tcat = useTranslations("categories");
  const tt = useTranslations("tools");
  const allTools = getAllTools();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative text-center py-12 sm:py-16">
        <div className="absolute inset-0 dot-pattern opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
        <div className="relative">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-gradient">
          {t("hero")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("heroSub")}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <FeatureBadge icon={<Shield className="h-4 w-4" />} label={t("featurePrivate")} />
          <FeatureBadge icon={<Zap className="h-4 w-4" />} label={t("featureInstant")} />
          <FeatureBadge icon={<Globe className="h-4 w-4" />} label={t("featureNoUpload")} />
        </div>
        </div>
      </section>

      {/* Deck groups */}
      {decks.map((deck) => {
        const deckTools = allTools.filter((tool) =>
          (deck.categories as readonly string[]).includes(tool.category),
        );
        return (
          <section key={deck.titleKey}>
            <h2 className="text-xl font-semibold mb-4">{t(deck.titleKey)}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deckTools.map((tool, i) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.category}/${tool.slug}`}
                >
                  <Card
                    className="p-4 h-full gradient-border animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">
                        {tt(`${tool.category}.${tool.slug}.name`)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {tt(`${tool.category}.${tool.slug}.description`)}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {tcat(`${tool.category}.name`)}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Meta Deck */}
      <section>
        <h2 className="text-xl font-semibold mb-1">{t("metaDeck")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("metaDeckDesc")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metaDeckSlugs.map((slug) => {
            const tool = allTools.find((t) => t.slug === slug);
            if (!tool) return null;
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.category}/${tool.slug}`}
              >
                <Card className="p-4 h-full gradient-border">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">
                      {tt(`${tool.category}.${tool.slug}.name`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {tt(`${tool.category}.${tool.slug}.description`)}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {tcat(`${tool.category}.name`)}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All Categories */}
      <section>
        <h2 className="text-xl font-semibold mb-6">{t("allCategories")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const catTools = allTools.filter((t) => t.category === cat.key);
            return (
              <Link key={cat.key} href={`/tools/${cat.key}`}>
                <Card className="p-5 gradient-border">
                  <h3 className="font-semibold">{tcat(`${cat.key}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tcat(`${cat.key}.description`)}
                  </p>
                  <p className="mt-3 text-xs text-primary">
                    {t("toolCount", { count: catTools.length })}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FeatureBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2 text-sm text-muted-foreground hover:border-primary/30 hover:shadow-[var(--glow-primary)] transition-all duration-300">
      {icon}
      {label}
    </div>
  );
}
