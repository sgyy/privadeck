"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { createToolTracker } from "@/lib/analytics";
import { addWatermark, type WatermarkOptions } from "./logic";

const tracker = createToolTracker("watermark", "image");

type Position = WatermarkOptions["position"];

const POSITIONS: Position[] = [
  "center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "tile",
];

export default function ImageWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<Position>("center");
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const previewUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const t = useTranslations("tools.image.watermark");
  const tc = useTranslations("common");

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      const newUrl = URL.createObjectURL(f);
      previewUrlRef.current = newUrl;
      return newUrl;
    });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      resultUrlRef.current = "";
      return "";
    });
  }

  // Live preview: re-generate watermark on parameter change with debounce
  const generatePreview = useCallback(async () => {
    if (!file || !text) return;
    try {
      const blob = await addWatermark(file, {
        text,
        fontSize,
        color,
        opacity,
        position,
      });
      setResult(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        const newUrl = URL.createObjectURL(blob);
        resultUrlRef.current = newUrl;
        return newUrl;
      });
    } catch {
      // Silently ignore preview errors
    }
  }, [file, text, fontSize, color, opacity, position]);

  useEffect(() => {
    if (!file) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(generatePreview, 300);
    return () => clearTimeout(debounceRef.current);
  }, [generatePreview, file]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/*" onFiles={handleFile} />

      {file && (
        <>
          {(resultUrl || previewUrl) && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={resultUrl || previewUrl}
                alt="Preview"
                className="max-h-[400px] w-full object-contain"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("text")}
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("position")}
              </label>
              <Select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {t(p)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("fontSize")}: {fontSize}px
              </label>
              <input
                type="range"
                min={12}
                max={200}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("color")}
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-border"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">
                  {t("opacity")}: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {result && (
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  if (!result || !file) return;
                  setResults((prev) => [
                    {
                      blob: result,
                      filename: `watermarked_${file.name}`,
                    },
                    ...prev,
                  ]);
                  tracker.trackProcessComplete(0);
                }}
              >
                {tc("save")}
              </Button>
            </div>
          )}

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
