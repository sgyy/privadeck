"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import {
  FONT_REGISTRY,
  suggestFontForText,
} from "@/tools/image/add-text/lib/fonts";
import { useWatermark } from "../WatermarkContext";
import {
  SYSTEM_FONT_KEY,
  type TextWatermark,
  type WatermarkConfig,
} from "../lib/config";

export function TextWatermarkControls() {
  const { config, setConfig } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const text = config.text;

  const patchText = (patch: Partial<TextWatermark>) =>
    setConfig((prev: WatermarkConfig) => ({
      ...prev,
      text: { ...prev.text, ...patch },
    }));

  const patchTransform = (patch: Partial<WatermarkConfig["transform"]>) =>
    setConfig((prev) => ({
      ...prev,
      transform: { ...prev.transform, ...patch },
    }));

  const suggested = useMemo(() => {
    const f = suggestFontForText(text.text);
    if (!f) return null;
    const family = f.family;
    const isActive = text.fontKey === f.key;
    return isActive ? null : { key: f.key, family };
  }, [text.text, text.fontKey]);

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("text")}</label>
        <input
          type="text"
          value={text.text}
          onChange={(e) => patchText({ text: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {suggested && (
          <button
            type="button"
            onClick={() => patchText({ fontKey: suggested.key })}
            className="mt-1.5 cursor-pointer text-xs text-primary hover:underline"
          >
            {t("suggestFont", { font: suggested.family })}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("font")}</label>
          <Select
            value={text.fontKey}
            onChange={(e) => patchText({ fontKey: e.target.value })}
            className="w-full"
          >
            <option value={SYSTEM_FONT_KEY}>{t("fontSystem")}</option>
            {FONT_REGISTRY.map((f) => (
              <option key={f.key} value={f.key}>
                {f.family}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">
              {t("fontWeight")}
            </label>
            <Select
              value={String(text.fontWeight)}
              onChange={(e) =>
                patchText({
                  fontWeight: Number(e.target.value) as 400 | 700,
                })
              }
              className="w-full"
            >
              <option value="400">{t("weightRegular")}</option>
              <option value="700">{t("weightBold")}</option>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">
              {t("fontStyle")}
            </label>
            <Select
              value={text.fontStyle}
              onChange={(e) =>
                patchText({
                  fontStyle: e.target.value as "normal" | "italic",
                })
              }
              className="w-full"
            >
              <option value="normal">{t("styleNormal")}</option>
              <option value="italic">{t("styleItalic")}</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("size")}: {Math.round(text.sizeNorm * 100)}%
          </label>
          <input
            type="range"
            min={0.01}
            max={0.4}
            step={0.005}
            value={text.sizeNorm}
            onChange={(e) => patchText({ sizeNorm: Number(e.target.value) })}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("textColor")}
            </label>
            <input
              type="color"
              value={text.color}
              onChange={(e) => patchText({ color: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded border border-border"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">
              {t("opacity")}: {Math.round(config.transform.opacity * 100)}%
            </label>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={config.transform.opacity}
              onChange={(e) =>
                patchTransform({ opacity: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("rotation")}: {Math.round(config.transform.rotationDeg)}°
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={config.transform.rotationDeg}
            onChange={(e) =>
              patchTransform({ rotationDeg: Number(e.target.value) })
            }
            className="w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("strokeColor")}
            </label>
            <input
              type="color"
              value={text.strokeColor}
              onChange={(e) => patchText({ strokeColor: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded border border-border"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-sm font-medium">
              {t("strokeWidth")}: {Math.round(text.strokeWidthNorm * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={0.15}
              step={0.005}
              value={text.strokeWidthNorm}
              onChange={(e) =>
                patchText({ strokeWidthNorm: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={text.shadowEnabled}
            onChange={(e) => patchText({ shadowEnabled: e.target.checked })}
            className="cursor-pointer rounded border-border"
          />
          {t("shadow")}
        </label>

        {text.shadowEnabled && (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("shadowColor")}
              </label>
              <input
                type="color"
                value={text.shadowColor}
                onChange={(e) => patchText({ shadowColor: e.target.value })}
                className="h-10 w-16 cursor-pointer rounded border border-border"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-sm font-medium">
                {t("shadowBlur")}: {Math.round(text.shadowBlurNorm * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={text.shadowBlurNorm}
                onChange={(e) =>
                  patchText({ shadowBlurNorm: Number(e.target.value) })
                }
                className="w-full cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
