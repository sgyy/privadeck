"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { EditorProvider, useEditor } from "./EditorContext";
import { EditorCanvas } from "./components/EditorCanvas";
import { TextStyleControls } from "./components/TextStyleControls";
import { EffectsControls } from "./components/EffectsControls";
import { BackgroundControls } from "./components/BackgroundControls";
import { StylePresets } from "./components/StylePresets";
import { LayerPanel } from "./components/LayerPanel";
import { ExportPanel } from "./components/ExportPanel";
import { BatchPanel } from "./components/BatchPanel";
import { HistoryControls } from "./components/HistoryControls";
import { preloadFonts } from "./lib/fonts";

function EditorShell() {
  const { state, dispatch } = useEditor();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  // Lifted out of ExportPanel/BatchPanel so a single full-width result grid
  // sits below the canvas. The 340px aside is too narrow for the card grid
  // to render well otherwise.
  const [results, setResults] = useState<ImageResultItem[]>([]);
  // Cancellation token for in-flight createImageBitmap calls. Without this,
  // rapid file swaps can dispatch out-of-order — the slower load wins,
  // overwrites the newer bitmap in state, and orphans it (state never points
  // at it again so EditorContext's cleanup never closes it).
  const inflightRef = useRef<{ cancelled: boolean } | null>(null);
  const t = useTranslations("tools.image.add-text");

  useEffect(() => {
    preloadFonts();
  }, []);

  // ImageBitmap lifecycle is owned by EditorProvider via a useEffect cleanup
  // keyed on state.imageBitmap. We just dispatch new bitmaps here; the old
  // one is closed asynchronously after React commits the swap.
  const handleFileChange = useCallback(
    async (f: File | null) => {
      // Cancel any earlier in-flight load
      if (inflightRef.current) inflightRef.current.cancelled = true;
      const token = { cancelled: false };
      inflightRef.current = token;

      setFile(f);
      if (!f) {
        dispatch({ type: "CLEAR_IMAGE" });
        return;
      }
      setLoading(true);
      try {
        const bitmap = await createImageBitmap(f);
        if (token.cancelled) {
          bitmap.close();
          return;
        }
        dispatch({
          type: "SET_IMAGE",
          payload: {
            bitmap,
            naturalSize: { w: bitmap.width, h: bitmap.height },
          },
        });
      } catch (e) {
        if (!token.cancelled) console.error("Failed to load image", e);
      } finally {
        if (!token.cancelled) setLoading(false);
      }
    },
    [dispatch],
  );

  const baseName = file?.name.replace(/\.[^.]+$/, "") || "image";

  return (
    <div className="space-y-4">
      <SingleImageUpload file={file} onFileChange={handleFileChange} accept="image/*" />

      {loading && (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      )}

      {state.imageNaturalSize && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <HistoryControls />
              <span className="text-xs text-muted-foreground">
                {state.imageNaturalSize.w}×{state.imageNaturalSize.h}px
              </span>
            </div>
            <EditorCanvas />
          </div>

          <aside className="space-y-3 rounded-lg border border-border bg-card p-3">
            <LayerPanel />
            <hr className="border-border" />

            <Tabs defaultValue="style">
              <TabsList className="w-full flex-wrap">
                <TabsTrigger value="style" className="flex-1">
                  {t("tabStyle")}
                </TabsTrigger>
                <TabsTrigger value="effects" className="flex-1">
                  {t("tabEffects")}
                </TabsTrigger>
                <TabsTrigger value="background" className="flex-1">
                  {t("tabBackground")}
                </TabsTrigger>
                <TabsTrigger value="presets" className="flex-1">
                  {t("tabPresets")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="style">
                <TextStyleControls />
              </TabsContent>
              <TabsContent value="effects">
                <EffectsControls />
              </TabsContent>
              <TabsContent value="background">
                <BackgroundControls />
              </TabsContent>
              <TabsContent value="presets">
                <StylePresets />
              </TabsContent>
            </Tabs>

            <hr className="border-border" />

            <Tabs defaultValue="export">
              <TabsList className="w-full">
                <TabsTrigger value="export" className="flex-1">
                  {t("tabExport")}
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex-1">
                  {t("tabBatch")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="export">
                <ExportPanel
                  baseFilename={baseName}
                  onResult={(item) => setResults((prev) => [item, ...prev])}
                />
              </TabsContent>
              <TabsContent value="batch">
                <BatchPanel
                  onResult={(item) => setResults((prev) => [item, ...prev])}
                />
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      )}

      {results.length > 0 && (
        <ImageResultList
          results={results}
          onRemove={(i) =>
            setResults((prev) => prev.filter((_, idx) => idx !== i))
          }
        />
      )}
    </div>
  );
}

export default function AddText() {
  return (
    <EditorProvider>
      <EditorShell />
    </EditorProvider>
  );
}
