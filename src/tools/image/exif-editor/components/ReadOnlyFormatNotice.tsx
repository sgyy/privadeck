"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

export function ReadOnlyFormatNotice({ mime }: { mime: string }) {
  const t = useTranslations("tools.image.exif-editor");
  const formatName = formatLabel(mime);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300/50 bg-amber-50/60 p-4 text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
      <Info className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1 text-sm">
        <p className="font-medium">{t("viewer.readOnlyTitle")}</p>
        <p className="text-amber-800/80 dark:text-amber-200/80">
          {t("viewer.readOnlyNotice", { format: formatName })}
        </p>
      </div>
    </div>
  );
}

function formatLabel(mime: string): string {
  if (mime === "image/heic" || mime === "image/heif") return "HEIC";
  if (mime === "image/avif") return "AVIF";
  if (mime === "image/tiff") return "TIFF";
  return mime || "unknown";
}
