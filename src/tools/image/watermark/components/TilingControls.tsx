"use client";

import { useTranslations } from "next-intl";
import { useWatermark } from "../WatermarkContext";
import type { TilingConfig } from "../lib/config";

export function TilingControls() {
  const { config, setConfig } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const tiling = config.tiling;

  const patch = (p: Partial<TilingConfig>) =>
    setConfig((prev) => ({ ...prev, tiling: { ...prev.tiling, ...p } }));

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={tiling.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
          className="cursor-pointer rounded border-border"
        />
        {t("tileEnable")}
      </label>

      {tiling.enabled && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("tileDensity")}: {tiling.density.toFixed(1)}×
            </label>
            <input
              type="range"
              min={0.3}
              max={3}
              step={0.1}
              value={tiling.density}
              onChange={(e) => patch({ density: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("tileAngle")}: {Math.round(tiling.angleDeg)}°
            </label>
            <input
              type="range"
              min={-90}
              max={90}
              step={1}
              value={tiling.angleDeg}
              onChange={(e) => patch({ angleDeg: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("tileGapX")}: {Math.round(tiling.gapXNorm * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={tiling.gapXNorm}
              onChange={(e) => patch({ gapXNorm: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("tileGapY")}: {Math.round(tiling.gapYNorm * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={tiling.gapYNorm}
              onChange={(e) => patch({ gapYNorm: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
