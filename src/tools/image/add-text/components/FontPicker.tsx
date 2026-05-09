"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import { FONT_REGISTRY, loadFont, type FontCategory } from "../lib/fonts";
import { SystemFontBrowser } from "./SystemFontBrowser";
import { FontCombobox, type FontItem } from "./FontCombobox";

const CATEGORY_ORDER: FontCategory[] = [
  "sans",
  "serif",
  "display",
  "script",
  "cjk",
  "arabic",
];
// Lower groupOrder renders first. System fonts above bundled categories so
// they're discoverable, then bundled by category in the registry order above.
const GROUP_ORDER_SYSTEM = 0;
const GROUP_ORDER_CATEGORY_BASE = 10;

export function FontPicker() {
  const { selectedLayer, updateSelected, systemFonts } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const [loadingFamily, setLoadingFamily] = useState<string | null>(null);
  // Epoch counter; rapid font switches discard stale awaits.
  const epochRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Lazy-load every bundled non-preloaded font once the picker is on screen,
  // so the FontCombobox can preview each row in its real face. loadFont caches
  // by key so the parallel fan-out is cheap on repeat mounts.
  useEffect(() => {
    for (const f of FONT_REGISTRY) {
      if (!f.preload) loadFont(f.key);
    }
  }, []);

  const items = useMemo<FontItem[]>(() => {
    const out: FontItem[] = [];
    const systemLabel = t("systemFonts");
    for (const s of systemFonts) {
      out.push({
        key: s.key,
        family: s.family,
        group: systemLabel,
        groupOrder: GROUP_ORDER_SYSTEM,
      });
    }
    CATEGORY_ORDER.forEach((cat, idx) => {
      const label = t(`fontCategories.${cat}`);
      for (const f of FONT_REGISTRY) {
        if (f.category !== cat) continue;
        out.push({
          key: f.key,
          family: f.family,
          group: label,
          groupOrder: GROUP_ORDER_CATEGORY_BASE + idx,
        });
      }
    });
    return out;
  }, [systemFonts, t]);

  const currentFamily = selectedLayer?.fontFamily ?? null;
  const currentValue = currentFamily === "system-ui" ? null : currentFamily;

  // Ensure the *current* font has its file loaded for canvas rendering, even
  // before the user opens the combobox (e.g. on first mount with the default
  // layer's font). Non-bundled families (system fonts, unknown) won't match
  // FONT_REGISTRY and silently no-op.
  useEffect(() => {
    if (!currentFamily || currentFamily === "system-ui") return;
    const bundled = FONT_REGISTRY.find((f) => f.family === currentFamily);
    if (bundled) loadFont(bundled.key);
  }, [currentFamily]);

  if (!selectedLayer) return null;

  async function handleChange(family: string) {
    // System default sentinel — no font to load.
    if (family === "system-ui") {
      updateSelected({ fontFamily: family });
      return;
    }
    const sys = systemFonts.find((s) => s.family === family);
    const bundled = FONT_REGISTRY.find((f) => f.family === family);

    const myEpoch = ++epochRef.current;
    setLoadingFamily(family);
    try {
      if (sys) {
        // Warm canvas font cache; without this, first measureText after the
        // switch can use fallback metrics and shift the next frame.
        if (typeof document !== "undefined" && document.fonts?.load) {
          await document.fonts.load(`16px "${family}"`);
        }
      } else if (bundled) {
        await loadFont(bundled.key);
      }
    } catch {
      // Best-effort; canvas falls back gracefully if load rejects.
    }
    if (!isMountedRef.current) return;
    if (epochRef.current !== myEpoch) return; // superseded by a later switch
    setLoadingFamily(null);
    updateSelected({ fontFamily: family });
  }

  // loadingFamily holds the *target* during the await; currentFamily updates
  // only after success. Showing the indicator while loadingFamily is non-null
  // matches the actual in-flight window.
  const status = loadingFamily ? t("fontLoading") : null;

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-xs font-medium">{t("font")}</label>
      <SystemFontBrowser />
      <FontCombobox
        items={items}
        value={currentValue}
        defaultLabel={t("fontSystemDefault")}
        onChange={handleChange}
        status={status}
      />
      {currentValue && (
        <p
          className="mt-1 truncate text-sm text-muted-foreground"
          style={{ fontFamily: `${currentValue}, system-ui, sans-serif` }}
        >
          {t("fontPreview")}
        </p>
      )}
    </div>
  );
}
