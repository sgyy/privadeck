"use client";

import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import type { BgMode } from "../lib/reducer";

const MODE_KEYS: BgMode[] = ["none", "full", "line", "word"];

export function BackgroundControls() {
  const { selectedLayer, updateSelected } = useEditor();
  const t = useTranslations("tools.image.add-text");
  if (!selectedLayer) {
    return (
      <p className="text-xs text-muted-foreground">{t("selectEmptyBg")}</p>
    );
  }

  // Arc renderer skips the bg pass — see renderer.ts drawLayerInline. Grey
  // out the controls so the user isn't typing into a no-op.
  const isArc =
    selectedLayer.curveMode === "arc" && selectedLayer.curvature !== 0;

  return (
    <div
      className={`space-y-3 ${isArc ? "pointer-events-none opacity-50" : ""}`}
      aria-disabled={isArc}
    >
      <div>
        <label className="mb-1 block text-xs font-medium">{t("bgMode")}</label>
        <div className="grid grid-cols-2 gap-1">
          {MODE_KEYS.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateSelected({ bgMode: mode })}
              className={`rounded border px-2 py-1.5 text-xs ${
                selectedLayer.bgMode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {t(`bgModes.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      {selectedLayer.bgMode !== "none" && (
        <>
          <div className="flex gap-2">
            <div>
              <label className="mb-1 block text-xs">{t("color")}</label>
              <input
                type="color"
                value={selectedLayer.bgColor}
                onChange={(e) => updateSelected({ bgColor: e.target.value })}
                className="h-8 w-14 cursor-pointer rounded border border-border"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs">
                {t("opacity")}: {Math.round(selectedLayer.bgOpacity * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedLayer.bgOpacity}
                onChange={(e) =>
                  updateSelected({ bgOpacity: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs">
                {t("paddingX")}: {selectedLayer.bgPaddingX}
              </label>
              <input
                type="range"
                min={0}
                max={60}
                value={selectedLayer.bgPaddingX}
                onChange={(e) =>
                  updateSelected({ bgPaddingX: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs">
                {t("paddingY")}: {selectedLayer.bgPaddingY}
              </label>
              <input
                type="range"
                min={0}
                max={60}
                value={selectedLayer.bgPaddingY}
                onChange={(e) =>
                  updateSelected({ bgPaddingY: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs">
              {t("cornerRadius")}: {selectedLayer.bgRadius}px
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={selectedLayer.bgRadius}
              onChange={(e) =>
                updateSelected({ bgRadius: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
}
