"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Button } from "@/components/ui/Button";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { addBorder } from "./logic";

export default function AddBorder() {
  const t = useTranslations("tools.image.add-border");
  const [file, setFile] = useState<File | null>(null);
  const [borderWidth, setBorderWidth] = useState(20);
  const [color, setColor] = useState("#000000");
  const [result, setResult] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultUrl = useObjectUrl(result);

  async function handleProcess() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await addBorder(file, borderWidth, color);
      setResult(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/*"
        onFiles={(files) => {
          setFile(files[0]);
          setResult(null);
          setError(null);
        }}
      />

      {file && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          {file.name}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("borderWidth")}: {borderWidth}px
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1px</span>
          <span>100px</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("borderColor")}</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-border"
          />
          <span className="text-sm text-muted-foreground">{color}</span>
        </div>
      </div>

      <Button onClick={handleProcess} disabled={!file || processing}>
        {processing ? t("processing") : t("addBorder")}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {result && resultUrl && (
        <div className="space-y-3">
          <img
            src={resultUrl}
            alt="Result"
            className="max-h-96 rounded-lg"
          />
          <DownloadButton
            data={result}
            filename={`bordered-${file?.name?.replace(/\.[^.]+$/, "") || "image"}.png`}
          />
        </div>
      )}
    </div>
  );
}
