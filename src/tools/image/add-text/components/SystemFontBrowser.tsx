"use client";

import { useState, useSyncExternalStore } from "react";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";

// Server snapshot must say "unsupported" so SSR HTML matches the post-hydrate
// pre-mount state. After hydration, React calls getClientSnapshot and re-renders
// if the value differs (Chromium → true). This pattern avoids both the
// hydration mismatch and the eslint react-hooks/set-state-in-effect rule.
const subscribe = () => () => {};
const getClientSnapshot = () =>
  typeof window !== "undefined" &&
  typeof (window as unknown as { queryLocalFonts?: () => Promise<unknown> })
    .queryLocalFonts === "function";
const getServerSnapshot = () => false;

export function SystemFontBrowser() {
  const { systemFonts, loadSystemFonts } = useEditor();
  const t = useTranslations("tools.image.add-text");
  const supported = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supported) {
    return (
      <p className="text-[10px] text-muted-foreground">
        {t("systemFontsUnsupported")}
      </p>
    );
  }

  async function handleClick() {
    setError(null);
    setLoading(true);
    const result = await loadSystemFonts();
    setLoading(false);
    if (!result.ok) {
      setError(t("systemFontsError"));
    }
  }

  const loaded = systemFonts.length > 0;
  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
      >
        <Globe className="h-3.5 w-3.5" />
        {loading
          ? t("loading")
          : loaded
            ? t("systemFontsLoaded", { count: systemFonts.length })
            : t("browseSystemFonts")}
      </button>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t("browseSystemFontsHint")}
      </p>
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
