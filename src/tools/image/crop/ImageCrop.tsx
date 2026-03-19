"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import ReactCrop from "react-image-crop";
import type { Crop, PixelCrop, PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { FileDropzone } from "@/components/shared/FileDropzone";
import {
  ImageResultList,
  type ImageResultItem,
} from "@/components/shared/ImageResultList";
import { Button } from "@/components/ui/Button";
import { cropImage } from "./logic";

const ASPECT_RATIOS = [
  { label: "Free", value: 0 },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
];

export default function ImageCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [aspect, setAspect] = useState(0);
  const [croppedArea, setCroppedArea] = useState<PixelCrop | null>(null);
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const [cropping, setCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const t = useTranslations("tools.image.crop");

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setCrop(undefined);
    setCroppedArea(null);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(f);
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const { width, height } = img;
    // Set initial crop to center 80% of the image
    const cropWidth = width * 0.8;
    const cropHeight = height * 0.8;
    const initialCrop: Crop = {
      unit: "px",
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
    setCrop(initialCrop);
  }

  const onComplete = useCallback((pixelCrop: PixelCrop, _percentCrop: PercentCrop) => {
    setCroppedArea(pixelCrop);
  }, []);

  function handleAspectChange(value: number) {
    setAspect(value);
    // Reset crop when aspect changes so it re-centers
    const img = imgRef.current;
    if (!img) return;
    const { width, height } = img;
    const newAspect = value || undefined;
    if (newAspect) {
      // Calculate centered crop with the new aspect ratio
      let cropWidth = width * 0.8;
      let cropHeight = cropWidth / newAspect;
      if (cropHeight > height * 0.8) {
        cropHeight = height * 0.8;
        cropWidth = cropHeight * newAspect;
      }
      setCrop({
        unit: "px",
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    } else {
      // Free mode: keep current crop area unchanged
    }
  }

  async function handleCrop() {
    if (!file || !croppedArea || !imgRef.current) return;
    setCropping(true);
    try {
      // Scale pixel crop from displayed size to natural image size
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const scaledArea = {
        x: Math.round(croppedArea.x * scaleX),
        y: Math.round(croppedArea.y * scaleY),
        width: Math.round(croppedArea.width * scaleX),
        height: Math.round(croppedArea.height * scaleY),
      };
      const blob = await cropImage(file, scaledArea);
      setResults((prev) => [
        { blob, filename: `cropped_${file.name}` },
        ...prev,
      ]);
    } catch (e) {
      console.error("Crop failed:", e);
    } finally {
      setCropping(false);
    }
  }

  return (
    <div className="space-y-4">
      {!imageSrc && <FileDropzone accept="image/*" onFiles={handleFile} />}

      {imageSrc && (
        <>
          <div className="flex justify-center rounded-lg bg-muted p-2">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={onComplete}
              aspect={aspect || undefined}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop source"
                onLoad={handleImageLoad}
                style={{ maxHeight: "400px", maxWidth: "100%" }}
              />
            </ReactCrop>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("aspectRatio")}
              </label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => handleAspectChange(r.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      aspect === r.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {r.label === "Free" ? t("free") : r.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCrop} disabled={cropping}>
              {cropping ? t("cropping") : t("crop")}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setImageSrc("");
                setFile(null);
                setResults([]);
              }}
            >
              {t("reset")}
            </Button>
          </div>

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
