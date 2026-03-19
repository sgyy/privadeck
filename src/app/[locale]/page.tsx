import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield, Zap, Globe } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeUI />;
}

function HomeUI() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
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
          <FeatureBadge icon={<Shield className="h-4 w-4" />} label="100% Private" />
          <FeatureBadge icon={<Zap className="h-4 w-4" />} label="Instant Processing" />
          <FeatureBadge icon={<Globe className="h-4 w-4" />} label="No Upload Required" />
        </div>
      </section>

      {/* Popular Tools */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t("popular")}</h2>
          <Link
            href="/tools"
            className="text-sm text-primary hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allTools.slice(0, 6).map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.category}/${tool.slug}`}
            >
              <Card className="p-4 transition-all hover:bg-muted/50 hover:shadow-md h-full">
                <div className="flex items-start gap-3">
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
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-semibold mb-6">{t("allCategories")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const tools = allTools.filter((t) => t.category === cat.key);
            return (
              <Link key={cat.key} href={`/tools/${cat.key}`}>
                <Card className="p-5 transition-all hover:bg-muted/50 hover:shadow-md">
                  <h3 className="font-semibold">{tcat(`${cat.key}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tcat(`${cat.key}.description`)}
                  </p>
                  <p className="mt-3 text-xs text-primary">
                    {tools.length} tools →
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
