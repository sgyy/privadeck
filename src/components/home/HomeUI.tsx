"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { Card } from "@/components/ui/Card";
import { ToolCard } from "@/components/shared/ToolCard";
import { DynamicToolIcon } from "@/components/shared/DynamicToolIcon";
import { getCategoryTheme } from "@/lib/theme/categoryThemes";
import { Shield, Zap, Globe } from "lucide-react";
import { trackToolCardClick } from "@/lib/analytics";

const decks = [
  { titleKey: "mediaDeck" as const, categories: ["image", "video", "audio"] as const },
  { titleKey: "pdfDeck" as const, categories: ["pdf"] as const },
  { titleKey: "devDeck" as const, categories: ["developer"] as const },
];

const metaDeckSlugs = ["remove-exif", "hash-generator", "archive"] as const;

export function HomeUI() {
  const t = useTranslations("home");
  const tcat = useTranslations("categories");
  const tt = useTranslations("tools");
  const allTools = getAllTools();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative py-12 sm:py-16">
        <div className="absolute inset-0 dot-pattern opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
        <div className="relative text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-gradient">
            {t("hero")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
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
                  key={`${tool.category}-${tool.slug}`}
                  href={`/tools/${tool.category}/${tool.slug}`}
                  onClick={() => trackToolCardClick("home", tool.slug, tool.category, i)}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <ToolCard
                    icon={tool.icon}
                    category={tool.category}
                    name={tt(`${tool.category}.${tool.slug}.name`)}
                    description={tt(`${tool.category}.${tool.slug}.description`)}
                    showBadge
                    badgeLabel={tcat(`${tool.category}.name`)}
                  />
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
          {metaDeckSlugs.map((slug, i) => {
            const tool = allTools.find((t) => t.slug === slug);
            if (!tool) return null;
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.category}/${tool.slug}`}
                onClick={() => trackToolCardClick("home", tool.slug, tool.category, i)}
              >
                <ToolCard
                  icon={tool.icon}
                  category={tool.category}
                  name={tt(`${tool.category}.${tool.slug}.name`)}
                  description={tt(`${tool.category}.${tool.slug}.description`)}
                  showBadge
                  badgeLabel={tcat(`${tool.category}.name`)}
                />
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
            const theme = getCategoryTheme(cat.key);
            return (
              <Link key={cat.key} href={`/tools/${cat.key}`}>
                <Card className="p-5 group hover:shadow-[var(--shadow-card-hover)] transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${theme.iconBg} ${theme.iconBgDark}`}
                    >
                      <DynamicToolIcon name={cat.icon} className={`${theme.iconColor} ${theme.iconColorDark}`} size={20} />
                    </div>
                    <h3 className="font-semibold">{tcat(`${cat.key}.name`)}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tcat(`${cat.key}.description`)}
                  </p>
                  <p className="mt-3 text-xs font-medium text-primary">
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
