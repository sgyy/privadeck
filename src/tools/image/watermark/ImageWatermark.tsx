"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import { ImageResultList } from "@/components/shared/ImageResultList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { preloadFonts } from "@/tools/image/add-text/lib/fonts";
import { WatermarkProvider, useWatermark } from "./WatermarkContext";
import { TextTab } from "./tabs/TextTab";
import { ImageTab } from "./tabs/ImageTab";
import { BatchTab } from "./tabs/BatchTab";

function WatermarkShell() {
  const {
    bitmap,
    sourceFile,
    loadError,
    results,
    config,
    loadImage,
    clearImage,
    setConfig,
    removeResult,
  } = useWatermark();
  const t = useTranslations("tools.image.watermark");
  const [activeTab, setActiveTab] = useState<"text" | "image" | "batch">(
    config.mode,
  );

  useEffect(() => {
    preloadFonts();
  }, []);

  function handleTabChange(value: string) {
    if (value !== "text" && value !== "image" && value !== "batch") return;
    setActiveTab(value);
    // "batch" applies whatever mode is already selected; text/image set it.
    if (value === "text" || value === "image") {
      setConfig((prev) =>
        prev.mode === value ? prev : { ...prev, mode: value },
      );
    }
  }

  return (
    <div className="space-y-4">
      <SingleImageUpload
        file={sourceFile}
        onFileChange={(f) => (f ? loadImage(f) : clearImage())}
        accept="image/*"
        analyticsSlug="watermark"
        analyticsCategory="image"
      />

      {loadError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(loadError)}
        </p>
      )}

      {bitmap && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList aria-label={t("name")}>
            <TabsTrigger value="text">{t("tabText")}</TabsTrigger>
            <TabsTrigger value="image">{t("tabImage")}</TabsTrigger>
            <TabsTrigger value="batch">{t("tabBatch")}</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <TextTab />
          </TabsContent>
          <TabsContent value="image">
            <ImageTab />
          </TabsContent>
          <TabsContent value="batch">
            <BatchTab />
          </TabsContent>
        </Tabs>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("results")}</h3>
          <ImageResultList results={results} onRemove={removeResult} />
        </div>
      )}
    </div>
  );
}

export default function ImageWatermark() {
  return (
    <WatermarkProvider>
      <WatermarkShell />
    </WatermarkProvider>
  );
}
