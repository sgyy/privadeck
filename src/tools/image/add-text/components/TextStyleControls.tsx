"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import type { Align } from "../lib/reducer";
import { FontPicker } from "./FontPicker";

export function TextStyleControls() {
  const { selectedLayer, updateSelected } = useEditor();
  const t = useTranslations("tools.image.add-text");

  if (!selectedLayer) {
    return (
      <p className="text-xs text-muted-foreground">{t("selectEmptyText")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium">{t("text")}</label>
        <textarea
          value={selectedLayer.text}
          onChange={(e) => updateSelected({ text: e.target.value })}
          rows={3}
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <FontPicker />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            updateSelected({ fontWeight: selectedLayer.fontWeight === 700 ? 400 : 700 })
          }
          className={`flex-1 rounded border px-2 py-1.5 text-xs font-bold ${
            selectedLayer.fontWeight === 700
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() =>
            updateSelected({
              fontStyle: selectedLayer.fontStyle === "italic" ? "normal" : "italic",
            })
          }
          className={`flex-1 rounded border px-2 py-1.5 text-xs italic ${
            selectedLayer.fontStyle === "italic"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          I
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          {t("fontSize")}: {selectedLayer.fontSizePx}px
        </label>
        <input
          type="range"
          min={12}
          max={400}
          value={selectedLayer.fontSizePx}
          onChange={(e) => updateSelected({ fontSizePx: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="flex gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">{t("color")}</label>
          <input
            type="color"
            value={selectedLayer.color}
            onChange={(e) => updateSelected({ color: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-border"
          />
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium">{t("alignment")}</label>
          <div className="flex gap-1">
            {(
              [
                { value: "left" as Align, Icon: AlignLeft },
                { value: "center" as Align, Icon: AlignCenter },
                { value: "right" as Align, Icon: AlignRight },
              ]
            ).map(({ value, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSelected({ align: value })}
                className={`flex h-9 flex-1 items-center justify-center rounded border ${
                  selectedLayer.align === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
