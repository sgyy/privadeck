import { setRequestLocale } from "next-intl/server";
import { loadCommonMessages } from "@/lib/i18n/loadMessages";
import { buildToolNavData } from "@/lib/i18n/toolNavData";
import { BaseLayout } from "@/components/layout/BaseLayout";

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
    <BaseLayout
      locale="en"
      dir="ltr"
      messages={messages}
      toolNavData={toolNavData}
    >
      {children}
    </BaseLayout>
  );
}
