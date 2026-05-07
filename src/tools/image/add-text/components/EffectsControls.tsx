"use client";

import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";

export function EffectsControls() {
  const { selectedLayer, updateSelected } = useEditor();
  const t = useTranslations("tools.image.add-text");
  if (!selectedLayer) {
    return (
      <p className="text-xs text-muted-foreground">{t("selectEmptyEffects")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("opacity")}: {Math.round(selectedLayer.opacity * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={selectedLayer.opacity}
          onChange={(e) => updateSelected({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("rotation")}: {selectedLayer.rotationDeg}°
        </label>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={selectedLayer.rotationDeg}
          onChange={(e) => updateSelected({ rotationDeg: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("letterSpacing")}: {selectedLayer.letterSpacing}px
        </label>
        <input
          type="range"
          min={-10}
          max={40}
          step={1}
          value={selectedLayer.letterSpacing}
          onChange={(e) => updateSelected({ letterSpacing: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("lineHeight")}: {selectedLayer.lineHeight.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.8}
          max={3}
          step={0.05}
          value={selectedLayer.lineHeight}
          onChange={(e) => updateSelected({ lineHeight: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <fieldset className="space-y-2 rounded border border-border p-3">
        <legend className="px-1 text-xs font-medium">{t("stroke")}</legend>
        <div>
          <label className="mb-1 block text-xs">
            {t("width")}: {selectedLayer.strokeWidth}px
          </label>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={selectedLayer.strokeWidth}
            onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs">{t("color")}</label>
          <input
            type="color"
            value={selectedLayer.strokeColor}
            onChange={(e) => updateSelected({ strokeColor: e.target.value })}
            className="h-8 w-14 cursor-pointer rounded border border-border"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2 rounded border border-border p-3">
        <legend className="px-1 text-xs font-medium">
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              checked={selectedLayer.shadowEnabled}
              onChange={(e) => updateSelected({ shadowEnabled: e.target.checked })}
            />
            {t("dropShadow")}
          </label>
        </legend>
        {selectedLayer.shadowEnabled && (
          <>
            <div>
              <label className="mb-1 block text-xs">{t("color")}</label>
              <input
                type="color"
                value={selectedLayer.shadowColor}
                onChange={(e) => updateSelected({ shadowColor: e.target.value })}
                className="h-8 w-14 cursor-pointer rounded border border-border"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">
                {t("blur")}: {selectedLayer.shadowBlur}px
              </label>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={selectedLayer.shadowBlur}
                onChange={(e) => updateSelected({ shadowBlur: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs">
                  {t("offsetX")}: {selectedLayer.shadowOffsetX}
                </label>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={selectedLayer.shadowOffsetX}
                  onChange={(e) =>
                    updateSelected({ shadowOffsetX: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs">
                  {t("offsetY")}: {selectedLayer.shadowOffsetY}
                </label>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={selectedLayer.shadowOffsetY}
                  onChange={(e) =>
                    updateSelected({ shadowOffsetY: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="space-y-2 rounded border border-border p-3">
        <legend className="px-1 text-xs font-medium">
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              checked={selectedLayer.wrapWidthNorm !== null}
              onChange={(e) =>
                updateSelected({
                  wrapWidthNorm: e.target.checked ? 0.7 : null,
                })
              }
            />
            {t("autoWrap")}
          </label>
        </legend>
        {selectedLayer.wrapWidthNorm !== null && (
          <div>
            <label className="mb-1 block text-xs">
              {t("maxWidth", {
                percent: Math.round(selectedLayer.wrapWidthNorm * 100),
              })}
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selectedLayer.wrapWidthNorm}
              onChange={(e) =>
                updateSelected({ wrapWidthNorm: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        )}
      </fieldset>
    </div>
  );
}
