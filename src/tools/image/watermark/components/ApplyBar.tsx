"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { createToolTracker } from "@/lib/analytics";
import { useWatermark } from "../WatermarkContext";
import { exportWatermark, extForMime, resolveMime } from "../lib/exportWatermark";

const tracker = createToolTracker("watermark", "image");

export function ApplyBar() {
  const {
    bitmap,
    naturalSize,
    sourceFile,
    config,
    output,
    addResult,
  } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hasWatermark =
    config.mode === "text"
      ? config.text.text.trim().length > 0
      : config.image.bitmap !== null;
  const disabled = !bitmap || !naturalSize || !hasWatermark || busy;

  async function handleApply() {
    if (!bitmap || !naturalSize) return;
    setBusy(true);
    setError("");
    const t0 = performance.now();
    try {
      const blob = await exportWatermark(
        bitmap,
        naturalSize,
        config,
        output,
        sourceFile?.type,
      );
      const mime = resolveMime(output, sourceFile?.type);
      const ext = extForMime(mime);
      const base = (sourceFile?.name ?? "image").replace(/\.[^.]+$/, "");
      addResult({
        blob,
        filename: `watermarked_${base}.${ext}`,
        meta: `${naturalSize.w}×${naturalSize.h}`,
      });
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(t("errExport"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleApply} disabled={disabled}>
        {busy ? t("applying") : t("addToResults")}
      </Button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
