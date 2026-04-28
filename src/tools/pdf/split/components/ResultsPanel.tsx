"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Archive, AlertTriangle } from "lucide-react";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { packAsZip, formatFileSize, type SplitResult } from "../logic";

interface ResultsPanelProps {
  results: SplitResult[];
  zipName: string;
}

export function ResultsPanel({ results, zipName }: ResultsPanelProps) {
  const t = useTranslations("tools.pdf.split");
  const [zipping, setZipping] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  if (results.length === 0) return null;

  async function handlePackZip() {
    setZipping(true);
    try {
      const { blob } = await packAsZip(results, zipName);
      setZipBlob(blob);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {t("results")} ({results.length})
        </h3>
        {results.length > 1 && (
          zipBlob ? (
            <DownloadButton data={zipBlob} filename={zipName} />
          ) : (
            <Button onClick={handlePackZip} disabled={zipping} size="sm">
              <Archive className="h-4 w-4" />
              {zipping ? t("progress.zipping") : t("actions.downloadAll")}
            </Button>
          )
        )}
      </div>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium flex items-center gap-2">
                {r.oversized && (
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                )}
                {r.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.pageCount} {t("pages")} · {formatFileSize(r.blob.size)}
                {r.label && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5">
                    {r.label}
                  </span>
                )}
              </p>
            </div>
            <DownloadButton data={r.blob} filename={r.filename} />
          </div>
        ))}
      </div>
    </div>
  );
}
