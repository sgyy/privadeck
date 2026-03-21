"use client";

import { Shield, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function FFmpegLoadingState() {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-8">
      <div className="relative">
        <Shield className="h-10 w-10 text-primary/80" />
        <Loader2 className="absolute -right-1 -bottom-1 h-5 w-5 animate-spin text-emerald-500" />
      </div>
      <p className="text-sm font-medium">{t("ffmpegLoading")}</p>
      <p className="text-xs text-muted-foreground">{t("ffmpegLoadingHint")}</p>
    </div>
  );
}
