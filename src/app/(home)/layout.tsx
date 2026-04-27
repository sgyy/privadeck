import { setRequestLocale } from "next-intl/server";
import Script from "next/script";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { themeInitScript } from "@/lib/theme/theme-init-script";
import { loadCommonMessages } from "@/lib/i18n/loadMessages";
import { buildToolNavData } from "@/lib/i18n/toolNavData";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { GoogleAnalyticsScripts } from "@/components/shared/GoogleAnalyticsScripts";
import { geistSans, geistMono } from "@/lib/fonts";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  setRequestLocale("en");
  const [messages, toolNavData] = await Promise.all([
    loadCommonMessages("en"),
    buildToolNavData("en"),
  ]);

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
        <link rel="alternate" type="text/plain" title="llms-full.txt" href="/llms-full.txt" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        <ThemeProvider>
          <BaseLayout
            locale="en"
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
