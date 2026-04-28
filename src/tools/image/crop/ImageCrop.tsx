"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import "react-advanced-cropper/dist/themes/compact.css";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal2,
  FlipVertical2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import { createToolTracker } from "@/lib/analytics";
import { canvasToBlob } from "./logic";

const tracker = createToolTracker("crop", "image");

// --- Constants ---

const ASPECT_RATIOS: { labelKey?: string; label?: string; value: number }[] = [
  { labelKey: "free", value: 0 },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
];

const SOCIAL_PRESETS = [
  { labelKey: "presetInstagramPost", w: 1080, h: 1080 },
  { labelKey: "presetInstagramStory", w: 1080, h: 1920 },
  { labelKey: "presetFacebookCover", w: 820, h: 312 },
  { labelKey: "presetYouTube", w: 1280, h: 720 },
  { labelKey: "presetTwitterHeader", w: 1500, h: 500 },
  { labelKey: "presetLinkedIn", w: 1200, h: 627 },
] as const;

const OUTPUT_FORMATS: { labelKey?: string; label?: string; value: string }[] = [
  { labelKey: "formatOriginal", value: "" },
  { label: "JPEG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WebP", value: "image/webp" },
];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ImageCrop() {
  // --- File state ---
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState("");

  // --- Crop settings ---
  const [aspect, setAspect] = useState(0); // 0 = free
  const [showGrid, setShowGrid] = useState(true);
  const [straighten, setStraighten] = useState(0); // -45 to 45 fine rotation
  const straightenRef = useRef(0);

  // --- Output settings ---
  const [outputFormat, setOutputFormat] = useState("");
  const [quality, setQuality] = useState(92);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // --- Dimensions display ---
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const [cropSize, setCropSize] = useState({ w: 0, h: 0 });

  // --- Output ---
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [cropping, setCropping] = useState(false);
  const [error, setError] = useState("");

  const cropperRef = useRef<CropperRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("tools.image.crop");

  // --- Handlers ---

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    resetSettings();
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(f);
  }

  function resetSettings() {
    setAspect(0);
    setShowGrid(true);
    setStraighten(0);
    straightenRef.current = 0;
    setOutputFormat("");
    setQuality(92);
    setActivePreset(null);
    setError("");
    setOriginalSize({ w: 0, h: 0 });
    setCropSize({ w: 0, h: 0 });
  }

  function handleReplaceImage() {
    fileInputRef.current?.click();
  }

  function onReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    resetSettings();
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  // --- Cropper callbacks (stable refs — Cropper won't re-init on re-render) ---

  const onUpdate = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    const coords = cropper.getCoordinates();
    if (coords) {
      setCropSize({ w: Math.round(coords.width), h: Math.round(coords.height) });
    }
  }, []);

  const onReady = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    const image = cropper.getImage();
    if (image) {
      setOriginalSize({ w: image.width, h: image.height });
    }
    onUpdate();
  }, [onUpdate]);

  // --- Aspect & preset handlers ---

  function handleAspectChange(value: number) {
    setAspect(value);
    setActivePreset(null);
  }

  function handleSocialPreset(key: string, w: number, h: number) {
    setAspect(w / h);
    setActivePreset(key);
  }

  // --- Output ---

  function getOutputFilename(): string {
    if (!file) return "cropped.png";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const mime = outputFormat || file.type || "image/png";
    const ext = MIME_TO_EXT[mime] || file.name.split(".").pop() || "png";
    return `cropped_${baseName}.${ext}`;
  }

  async function handleCrop() {
    const cropper = cropperRef.current;
    if (!cropper) return;

    setCropping(true);
    setError("");
    const t0 = performance.now();
    try {
      const canvas = cropper.getCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      if (!canvas) throw new Error("Canvas not available");

      const blob = await canvasToBlob(canvas, {
        outputFormat: outputFormat || file?.type || "image/png",
        quality: quality / 100,
      });

      const coords = cropper.getCoordinates();
      const meta = coords
        ? `${Math.round(coords.width)}×${Math.round(coords.height)}`
        : "";

      setResults((prev) => [
        { blob, filename: getOutputFilename(), meta },
        ...prev,
      ]);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      console.error("Crop failed:", e);
      tracker.trackProcessError(e instanceof Error ? e.message : String(e));
      setError(t("cropError"));
    } finally {
      setCropping(false);
    }
  }

  // --- Keyboard shortcuts ---

  const handleCropRef = useRef(handleCrop);
  handleCropRef.current = handleCrop;

  useEffect(() => {
    if (!imageSrc) return;

    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const cropper = cropperRef.current;
      if (!cropper) return;

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          handleCropRef.current();
          break;
        case "Escape":
          e.preventDefault();
          cropper.reset();
          break;
        case "+":
        case "=":
          e.preventDefault();
          cropper.zoomImage(1.1);
          break;
        case "-":
          e.preventDefault();
          cropper.zoomImage(0.9);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imageSrc]);

  // --- Computed ---

  const showQualitySlider =
    outputFormat === "image/jpeg" ||
    outputFormat === "image/webp" ||
    (!outputFormat && file?.type === "image/jpeg") ||
    (!outputFormat && file?.type === "image/webp");

  // --- Render ---

  return (
    <div className="space-y-4">
      {!imageSrc && <FileDropzone accept="image/*" onFiles={handleFile} />}

      {imageSrc && (
        <>
          {/* Hidden file input for replace */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onReplaceFile}
          />

          {/* Grid visibility override */}
          <style dangerouslySetInnerHTML={{ __html: `.crop-grid-visible .advanced-cropper-stencil-grid { opacity: 1 !important; }` }} />

          {/* Cropper area */}
          <div
            className={`overflow-hidden rounded-lg${showGrid ? " crop-grid-visible" : ""}`}
            style={{ height: "min(65vh, 600px)" }}
          >
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              stencilProps={{
                grid: showGrid,
                aspectRatio: aspect || undefined,
              }}
              className="h-full"
              onReady={onReady}
              onUpdate={onUpdate}
            />
          </div>

          {/* Real-time dimensions info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/50 bg-muted/30 px-4 py-2 text-sm">
            <span className="text-muted-foreground">{t("originalSize")}:</span>
            <span className="font-mono font-medium">
              {originalSize.w
                ? `${originalSize.w} × ${originalSize.h}`
                : "—"}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground">{t("outputSize")}:</span>
            <span className="font-mono font-medium text-primary">
              {cropSize.w ? `${cropSize.w} × ${cropSize.h}` : "—"}
            </span>
            {cropSize.w > 0 && originalSize.w > 0 && (
              <span className="text-xs text-muted-foreground">
                (
                {Math.round(
                  ((cropSize.w * cropSize.h) /
                    (originalSize.w * originalSize.h)) *
                    100,
                )}
                %)
              </span>
            )}
          </div>

          {/* Toolbar: Zoom + Rotation + Flip + Grid */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => cropperRef.current?.zoomImage(0.8)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("zoomOut")}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => cropperRef.current?.zoomImage(1.25)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("zoomIn")}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Rotation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  cropperRef.current?.rotateImage(-straightenRef.current - 90);
                  straightenRef.current = 0;
                  setStraighten(0);
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("rotateCCW")}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={straighten}
                onChange={(e) => {
                  const newVal = Number(e.target.value);
                  const delta = newVal - straightenRef.current;
                  straightenRef.current = newVal;
                  setStraighten(newVal);
                  cropperRef.current?.rotateImage(delta);
                }}
                className="h-1.5 w-20 cursor-pointer accent-primary"
              />
              <button
                type="button"
                onClick={() => {
                  cropperRef.current?.rotateImage(-straightenRef.current + 90);
                  straightenRef.current = 0;
                  setStraighten(0);
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("rotateCW")}
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <span className="min-w-[2.5rem] text-xs text-muted-foreground">
                {straighten}°
              </span>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Flip */}
            <button
              type="button"
              onClick={() => cropperRef.current?.flipImage(true, false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={t("flipH")}
            >
              <FlipHorizontal2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => cropperRef.current?.flipImage(false, true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={t("flipV")}
            >
              <FlipVertical2 className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-border" />

            {/* Grid toggle */}
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`rounded-md p-1.5 transition-colors ${showGrid ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              title={t("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs: Aspect Ratio | Social Presets | Output Settings */}
          <Tabs defaultValue="aspect">
            <TabsList>
              <TabsTrigger value="aspect">{t("tabAspect")}</TabsTrigger>
              <TabsTrigger value="presets">{t("tabPresets")}</TabsTrigger>
              <TabsTrigger value="output">{t("tabOutput")}</TabsTrigger>
            </TabsList>

            <TabsContent value="aspect">
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.labelKey || r.label}
                    type="button"
                    onClick={() => handleAspectChange(r.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      aspect === r.value && activePreset === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {r.labelKey ? t(r.labelKey) : r.label}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="presets">
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PRESETS.map((p) => (
                  <button
                    key={p.labelKey}
                    type="button"
                    onClick={() => handleSocialPreset(p.labelKey, p.w, p.h)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activePreset === p.labelKey
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {t(p.labelKey)}
                    <span
                      className={`ml-1 ${activePreset === p.labelKey ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {p.w}×{p.h}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="output">
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t("format")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OUTPUT_FORMATS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setOutputFormat(f.value)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          outputFormat === f.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {f.labelKey ? t(f.labelKey) : f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {showQualitySlider && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("quality")}: {quality}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="h-1.5 w-full max-w-xs cursor-pointer accent-primary"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action buttons — after all settings */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleCrop} disabled={cropping}>
              {cropping ? t("cropping") : t("crop")}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setImageSrc("");
                setFile(null);
                setResults([]);
                resetSettings();
              }}
            >
              {t("reset")}
            </Button>

            <button
              type="button"
              onClick={handleReplaceImage}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("replaceImage")}
            </button>

            <span className="ml-auto text-xs text-muted-foreground max-sm:hidden">
              {t("shortcuts")}
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          <ImageResultList
            results={results}
            onRemove={(i) =>
              setResults((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
        </>
      )}
    </div>
  );
}
