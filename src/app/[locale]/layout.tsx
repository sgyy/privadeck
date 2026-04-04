import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, rtlLocales, type Locale } from "@/i18n/routing";
import { loadCommonMessages } from "@/lib/i18n/loadMessages";
import { buildToolNavData } from "@/lib/i18n/toolNavData";
import { BaseLayout } from "@/components/layout/BaseLayout";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const [messages, toolNavData] = await Promise.all([
    loadCommonMessages(locale),
    buildToolNavData(locale),
  ]);

  return (
    <BaseLayout
      locale={locale}
      dir={rtlLocales.includes(locale as Locale) ? "rtl" : "ltr"}
      messages={messages}
      toolNavData={toolNavData}
    >
      {children}
    </BaseLayout>
  );
}
