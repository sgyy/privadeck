import { setRequestLocale } from "next-intl/server";
import { ThemeProvider, themeInitScript } from "@/lib/theme/ThemeProvider";
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
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
