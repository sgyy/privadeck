"use client";

import { NextIntlClientProvider } from "next-intl";
import { MainLayout } from "@/components/layout/MainLayout";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";
import { LocaleSuggestionBanner } from "@/components/shared/LocaleSuggestionBanner";

interface BaseLayoutProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, string>;
  toolNavData: ToolNavItem[];
}

export function BaseLayout({ children, locale, messages, toolNavData }: BaseLayoutProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <LocaleSuggestionBanner currentLocale={locale} />
      <MainLayout toolNavData={toolNavData}>{children}</MainLayout>
      <ServiceWorkerRegistration />
    </NextIntlClientProvider>
  );
}
