"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageUpload } from "@/components/shared/SingleImageUpload";
import { ImageResultList, type ImageResultItem } from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { createToolTracker } from "@/lib/analytics";
import { addTextToImage, type TextPosition } from "./logic";

const POSITIONS: TextPosition[] = [
  "center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const tracker = createToolTracker("add-text", "image");

export default function AddText() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<TextPosition>("center");
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.image.add-text");

  function handleFileChange(f: File | null) {
    setFile(f);
    setResults([]);
    setError("");
  }

  async function handleApply() {
    if (!file || !text) return;
    setProcessing(true);
    setError("");
    setResults([]);
    const start = Date.now();
    try {
      const blob = await addTextToImage(file, {
        text,
        fontSize,
        color,
        position,
      });
      tracker.trackProcessComplete(Date.now() - start);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const rawExt = blob.type.split("/")[1] || "png";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      setResults((prev) => [...prev, { blob, filename: `text_${baseName}.${ext}` }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed";
      tracker.trackProcessError(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <SingleImageUpload
        file={file}
        onFileChange={handleFileChange}
        accept="image/*"
      />

      {file && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("text")}
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("textPlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("position")}
              </label>
              <Select
                value={position}
                onChange={(e) => setPosition(e.target.value as TextPosition)}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {t(`positions.${p}`)}
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
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

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
          </div>

          <Button
            onClick={handleApply}
            disabled={!text || processing}
          >
            {processing ? t("processing") : t("apply")}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <ImageResultList
              results={results}
              onRemove={(i) => setResults((prev) => prev.filter((_, idx) => idx !== i))}
            />
          )}
        </>
      )}
    </div>
  );
}
