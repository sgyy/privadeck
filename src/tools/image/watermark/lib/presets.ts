import {
  createDefaultConfig,
  type WatermarkConfig,
} from "./config";

const STORAGE_KEY = "privadeck:watermark:presets:v1";

/**
 * Serialisable slice of a config. The logo bitmap is intentionally excluded —
 * it is neither serialisable nor something we want in localStorage; only the
 * logo's relative width travels with a preset.
 */
export type PresetConfig = Omit<WatermarkConfig, "image"> & {
  image: { widthNorm: number };
};

export interface WatermarkPreset {
  id: string;
  /** i18n key for built-ins (resolved via t()); literal name for user presets. */
  nameKey?: string;
  name?: string;
  builtin?: boolean;
  config: PresetConfig;
}

function toPresetConfig(c: WatermarkConfig): PresetConfig {
  return {
    mode: c.mode,
    transform: { ...c.transform },
    text: { ...c.text },
    tiling: { ...c.tiling },
    image: { widthNorm: c.image.widthNorm },
  };
}

function base(): PresetConfig {
  return toPresetConfig(createDefaultConfig());
}

export const BUILTIN_PRESETS: WatermarkPreset[] = [
  {
    id: "builtin-copyright",
    nameKey: "preset.copyright",
    builtin: true,
    config: {
      ...base(),
      mode: "text",
      transform: { xNorm: 0.8, yNorm: 0.93, rotationDeg: 0, opacity: 0.6 },
      text: {
        ...base().text,
        sizeNorm: 0.035,
        fontWeight: 400,
        shadowEnabled: true,
      },
      tiling: { ...base().tiling, enabled: false },
    },
  },
  {
    id: "builtin-diagonal-tile",
    nameKey: "preset.diagonalTile",
    builtin: true,
    config: {
      ...base(),
      mode: "text",
      transform: { xNorm: 0.5, yNorm: 0.5, rotationDeg: 0, opacity: 0.22 },
      text: { ...base().text, sizeNorm: 0.045, shadowEnabled: false },
      tiling: {
        enabled: true,
        gapXNorm: 0.14,
        gapYNorm: 0.18,
        angleDeg: -30,
        density: 1,
      },
    },
  },
  {
    id: "builtin-soft-center",
    nameKey: "preset.softCenter",
    builtin: true,
    config: {
      ...base(),
      mode: "text",
      transform: { xNorm: 0.5, yNorm: 0.5, rotationDeg: 0, opacity: 0.32 },
      text: {
        ...base().text,
        sizeNorm: 0.11,
        shadowEnabled: true,
        shadowBlurNorm: 0.2,
      },
      tiling: { ...base().tiling, enabled: false },
    },
  },
  {
    id: "builtin-bold-outline",
    nameKey: "preset.boldOutline",
    builtin: true,
    config: {
      ...base(),
      mode: "text",
      transform: { xNorm: 0.5, yNorm: 0.5, rotationDeg: 0, opacity: 0.9 },
      text: {
        ...base().text,
        sizeNorm: 0.12,
        fontWeight: 700,
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidthNorm: 0.045,
        shadowEnabled: false,
      },
      tiling: { ...base().tiling, enabled: false },
    },
  },
  {
    id: "builtin-logo-corner",
    nameKey: "preset.logoCorner",
    builtin: true,
    config: {
      ...base(),
      mode: "image",
      transform: { xNorm: 0.84, yNorm: 0.87, rotationDeg: 0, opacity: 0.85 },
      image: { widthNorm: 0.18 },
      tiling: { ...base().tiling, enabled: false },
    },
  },
  {
    id: "builtin-logo-tile",
    nameKey: "preset.logoTile",
    builtin: true,
    config: {
      ...base(),
      mode: "image",
      transform: { xNorm: 0.5, yNorm: 0.5, rotationDeg: 0, opacity: 0.5 },
      image: { widthNorm: 0.16 },
      tiling: {
        enabled: true,
        gapXNorm: 0.18,
        gapYNorm: 0.18,
        angleDeg: -30,
        density: 1,
      },
    },
  },
  {
    id: "builtin-logo-center",
    nameKey: "preset.logoCenter",
    builtin: true,
    config: {
      ...base(),
      mode: "image",
      transform: { xNorm: 0.5, yNorm: 0.5, rotationDeg: 0, opacity: 0.85 },
      image: { widthNorm: 0.4 },
      tiling: { ...base().tiling, enabled: false },
    },
  },
];

function readUserPresets(): WatermarkPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WatermarkPreset[]) : [];
  } catch {
    return [];
  }
}

function writeUserPresets(list: WatermarkPreset[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function listPresets(): WatermarkPreset[] {
  return [...BUILTIN_PRESETS, ...readUserPresets()];
}

export function savePreset(
  name: string,
  config: WatermarkConfig,
): WatermarkPreset | null {
  const preset: WatermarkPreset = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `preset-${Date.now()}`,
    name: name.trim() || "Untitled",
    config: toPresetConfig(config),
  };
  const next = [...readUserPresets(), preset];
  if (!writeUserPresets(next)) return null;
  return preset;
}

export function deletePreset(id: string): void {
  const next = readUserPresets().filter((p) => p.id !== id);
  writeUserPresets(next);
}

/**
 * Merge a preset into the current config while keeping the user's actual
 * watermark content (typed text + uploaded logo) — presets carry look &
 * placement, not the words/logo.
 */
export function applyPresetToConfig(
  preset: WatermarkPreset,
  prev: WatermarkConfig,
): WatermarkConfig {
  const c = preset.config;
  return {
    // Keep the current mode — PresetBar only offers presets matching it, and
    // never flipping mode keeps the visible tab/controls in sync with the
    // preview (defensive for any legacy cross-mode user preset too).
    mode: prev.mode,
    transform: { ...c.transform },
    text: { ...c.text, text: prev.text.text },
    tiling: { ...c.tiling },
    image: { ...prev.image, widthNorm: c.image.widthNorm },
  };
}
