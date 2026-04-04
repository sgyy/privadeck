"use client";

import { NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { MainLayout } from "@/components/layout/MainLayout";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";
import { LocaleSuggestionBanner } from "@/components/shared/LocaleSuggestionBanner";
import { getLocaleFontVariables } from "@/lib/fonts";
import type { Locale } from "@/i18n/routing";

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

interface BaseLayoutProps {
  children: React.ReactNode;
  locale: Locale;
  dir?: "ltr" | "rtl";
  messages: Record<string, string>;
  toolNavData: ToolNavItem[];
}

export function BaseLayout({ children, locale, dir = "ltr", messages, toolNavData }: BaseLayoutProps) {
  const { fontClasses, fontFallback } = getLocaleFontVariables(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={fontClasses}
      style={fontFallback ? { ["--font-locale-sans" as string]: fontFallback } : undefined}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LocaleSuggestionBanner currentLocale={locale} />
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
