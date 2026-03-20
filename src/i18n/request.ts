import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { hasLocale } from "next-intl";
import { loadAllToolMessages } from "@/lib/i18n/loadMessages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const common = (await import(`../../messages/${locale}/common.json`)).default;
  const toolMessages = await loadAllToolMessages(locale);

  return {
    locale,
    messages: { ...common, ...toolMessages },
  };
});
