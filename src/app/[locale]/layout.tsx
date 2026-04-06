import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { themeInitScript } from "@/lib/theme/theme-init-script";
import { locales, rtlLocales, type Locale } from "@/i18n/routing";
import { loadCommonMessages } from "@/lib/i18n/loadMessages";
import { buildToolNavData } from "@/lib/i18n/toolNavData";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { GoogleAnalyticsScripts } from "@/components/shared/GoogleAnalyticsScripts";
import { geistSans, geistMono, getLocaleFontVariables } from "@/lib/fonts";

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

  const { fontClasses, fontFallback } = getLocaleFontVariables(locale as Locale);
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={fontClasses}
      style={fontFallback ? { ["--font-locale-sans" as string]: fontFallback } : undefined}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        <ThemeProvider>
          <BaseLayout
            locale={locale}
            messages={messages}
            toolNavData={toolNavData}
          >
            {children}
          </BaseLayout>
        </ThemeProvider>
        <GoogleAnalyticsScripts />
      </body>
    </html>
  );
}
