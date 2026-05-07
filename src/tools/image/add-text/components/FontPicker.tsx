"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import { FONT_REGISTRY, loadFont, type FontCategory } from "../lib/fonts";

const CATEGORY_ORDER: FontCategory[] = ["sans", "serif", "display", "script", "cjk", "arabic"];

export function FontPicker() {
  const { selectedLayer, updateSelected } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  // Epoch counter; rapid font switches discard stale awaits.
  const epochRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    fonts: FONT_REGISTRY.filter((f) => f.category === cat),
  })).filter((g) => g.fonts.length > 0);

  const currentKey = selectedLayer
    ? (FONT_REGISTRY.find((f) => f.family === selectedLayer.fontFamily)?.key ?? "")
    : "";

  // Initial load: ensure default font available so first paint is correct
  useEffect(() => {
    if (currentKey) loadFont(currentKey);
  }, [currentKey]);

  if (!selectedLayer) return null;

  async function handleChange(key: string) {
    const font = FONT_REGISTRY.find((f) => f.key === key);
    if (!font) {
      updateSelected({ fontFamily: "system-ui" });
      return;
    }
    const myEpoch = ++epochRef.current;
    setLoadingKey(key);
    await loadFont(key);
    if (!isMountedRef.current) return;
    if (epochRef.current !== myEpoch) return; // superseded by a later switch
    setLoadingKey(null);
    updateSelected({ fontFamily: font.family });
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium">
        {t("font")}{" "}
        {loadingKey && (
          <span className="text-muted-foreground">{t("fontLoading")}</span>
        )}
      </label>
      <select
        value={currentKey}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">{t("fontSystemDefault")}</option>
        {grouped.map((g) => (
          <optgroup key={g.category} label={t(`fontCategories.${g.category}`)}>
            {g.fonts.map((f) => (
              <option key={f.key} value={f.key}>
                {f.family}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {currentKey && (
        <p
          className="mt-1 truncate text-sm text-muted-foreground"
          style={{ fontFamily: `${selectedLayer.fontFamily}, system-ui, sans-serif` }}
        >
          {t("fontPreview")}
        </p>
      )}
    </div>
  );
}
