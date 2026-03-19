import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
      <Link href="/" className="mt-8 text-primary hover:underline">
        {t("siteName")}
      </Link>
    </div>
  );
}
