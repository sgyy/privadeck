import { setRequestLocale } from "next-intl/server";
import { useTranslations, NextIntlClientProvider } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { Card } from "@/components/ui/Card";
import { loadAllToolMessages } from "@/lib/i18n/loadMessages";

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const toolMessages = await loadAllToolMessages(locale);
  return (
    <NextIntlClientProvider messages={toolMessages}>
      <ToolsPageUI />
    </NextIntlClientProvider>
  );
}

function ToolsPageUI() {
  const t = useTranslations("nav");
  const tc = useTranslations("categories");
  const tt = useTranslations("tools");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("tools")}
      </h1>

      {categories.map((cat) => {
        const tools = getAllTools().filter((tool) => tool.category === cat.key);

        return (
          <section key={cat.key}>
            <h2 className="mb-4 text-lg font-semibold">
              {tc(`${cat.key}.name`)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.category}/${tool.slug}`}
                >
                  <Card className="p-4 transition-colors hover:bg-muted/50 h-full">
                    <h3 className="font-medium">
                      {tt(`${tool.category}.${tool.slug}.name`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {tt(`${tool.category}.${tool.slug}.description`)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
