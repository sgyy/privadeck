import { useTranslations } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield, Zap, Globe } from "lucide-react";
import { loadCommonMessages, loadAllToolMessages } from "@/lib/i18n/loadMessages";

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
  return (
    <NextIntlClientProvider messages={{ ...commonMessages, ...toolMessages }}>
      <HomeUI />
    </NextIntlClientProvider>
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
      <section className="text-center py-8 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
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
              {deckTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.category}/${tool.slug}`}
                >
                  <Card className="p-4 transition-all hover:bg-muted/50 hover:shadow-md h-full">
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
                <Card className="p-4 transition-all hover:bg-muted/50 hover:shadow-md h-full">
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
                <Card className="p-5 transition-all hover:bg-muted/50 hover:shadow-md">
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
    <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
      {icon}
      {label}
    </div>
  );
}
