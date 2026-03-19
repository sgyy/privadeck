import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{t("privacy")}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("siteName")}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
