"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import { PRESETS } from "../lib/presets";
import { loadFont, getFontByFamily } from "../lib/fonts";

export function StylePresets() {
  const { selectedLayer, dispatch } = useEditor();
  const t = useTranslations("tools.image.add-text");
  // Bind the error to a specific layer id so switching layers naturally hides
  // a stale message (cheaper than tracking it in an effect).
  const [error, setError] = useState<{ layerId: string; name: string } | null>(
    null,
  );

  if (!selectedLayer) {
    return (
      <p className="text-xs text-muted-foreground">{t("selectEmptyPreset")}</p>
    );
  }

  async function applyPreset(presetId: string) {
    if (!selectedLayer) return;
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setError(null);
    if (preset.patch.fontFamily) {
      const font = getFontByFamily(preset.patch.fontFamily);
      if (font) {
        const ok = await loadFont(font.key);
        if (!ok) {
          setError({ layerId: selectedLayer.id, name: t(`presetNames.${preset.id}`) });
          return;
        }
      }
    }
    dispatch({
      type: "APPLY_PRESET",
      payload: { id: selectedLayer.id, patch: preset.patch },
    });
  }

  // Only surface an error that belongs to the layer the user is currently on.
  const showError = error && error.layerId === selectedLayer.id ? error : null;

  return (
    <div className="space-y-2">
      {showError && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {t("fontLoadFailed", { name: showError.name })}
        </p>
      )}
      <div className="grid grid-cols-3 gap-1.5">
      {PRESETS.map((preset) => {
        const previewStyle: React.CSSProperties = {
          fontFamily: `${preset.patch.fontFamily ?? "Inter"}, system-ui, sans-serif`,
          fontWeight: preset.patch.fontWeight ?? 700,
          fontStyle: preset.patch.fontStyle ?? "normal",
          color: preset.patch.color ?? "#fff",
          opacity: preset.patch.opacity ?? 1,
          WebkitTextStroke:
            preset.patch.strokeWidth && preset.patch.strokeColor
              ? `${Math.min(preset.patch.strokeWidth / 2, 2)}px ${preset.patch.strokeColor}`
              : undefined,
          textShadow: preset.patch.shadowEnabled
            ? `${preset.patch.shadowOffsetX ?? 0}px ${preset.patch.shadowOffsetY ?? 0}px ${preset.patch.shadowBlur ?? 0}px ${preset.patch.shadowColor ?? "#000"}`
            : undefined,
          background:
            preset.patch.bgMode === "full" || preset.patch.bgMode === "line"
              ? preset.patch.bgColor
              : undefined,
          padding: preset.patch.bgMode !== "none" && preset.patch.bgMode !== undefined ? "2px 6px" : undefined,
          borderRadius: preset.patch.bgRadius,
          transform: preset.patch.rotationDeg
            ? `rotate(${preset.patch.rotationDeg}deg)`
            : undefined,
        };
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className="group flex h-16 flex-col items-center justify-center overflow-hidden rounded border border-border bg-gradient-to-br from-slate-700 to-slate-900 transition-all hover:border-primary"
            title={t(`presetNames.${preset.id}`)}
          >
            <span className="text-lg leading-none" style={previewStyle}>
              {preset.preview}
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground transition-colors group-hover:text-foreground">
              {t(`presetNames.${preset.id}`)}
            </span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
