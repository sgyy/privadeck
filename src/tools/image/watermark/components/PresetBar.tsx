"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWatermark } from "../WatermarkContext";
import {
  applyPresetToConfig,
  deletePreset,
  listPresets,
  savePreset,
  type WatermarkPreset,
} from "../lib/presets";

export function PresetBar() {
  const { config, setConfig } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  // Tool is a client-only lazy import (never SSR'd), so reading localStorage
  // in the lazy initializer is safe and avoids a setState-in-effect.
  const [presets, setPresets] = useState<WatermarkPreset[]>(() =>
    listPresets(),
  );
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    setPresets(listPresets());
  }

  function apply(preset: WatermarkPreset) {
    setConfig((prev) => applyPresetToConfig(preset, prev));
  }

  function handleSave() {
    const saved = savePreset(draft, config);
    if (!saved) {
      setError(t("errStorage"));
      return;
    }
    setError("");
    setDraft("");
    setShowInput(false);
    refresh();
  }

  function handleDelete(id: string) {
    deletePreset(id);
    refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("presets")}</span>
        <button
          type="button"
          onClick={() => setShowInput((s) => !s)}
          className="cursor-pointer text-xs text-primary hover:underline"
        >
          {t("savePreset")}
        </button>
      </div>

      {showInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("presetName")}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <Button size="sm" onClick={handleSave}>
            {t("savePreset")}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {presets
          .filter((p) => p.config.mode === config.mode)
          .map((p) => (
          <div
            key={p.id}
            className="group flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-sm hover:bg-muted/70"
          >
            <button
              type="button"
              onClick={() => apply(p)}
              className="cursor-pointer"
            >
              {p.builtin && p.nameKey ? t(p.nameKey) : p.name}
            </button>
            {!p.builtin && (
              <button
                type="button"
                aria-label={t("deletePreset")}
                onClick={() => handleDelete(p.id)}
                className="cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
