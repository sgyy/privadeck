import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { locales, rtlLocales, type Locale } from "@/i18n/routing";
import { MainLayout } from "@/components/layout/MainLayout";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { loadCommonMessages } from "@/lib/i18n/loadMessages";
import { buildToolNavData } from "@/lib/i18n/toolNavData";

const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.toUpperCase();
const gaId = rawGaId?.match(/^G-[A-Z0-9]+$/) ? rawGaId : undefined;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang={locale} dir={rtlLocales.includes(locale as Locale) ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <MainLayout toolNavData={toolNavData}>{children}</MainLayout>
            <InstallPrompt />
            <ServiceWorkerRegistration />
          </NextIntlClientProvider>
        </ThemeProvider>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
