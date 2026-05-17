"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ImageSize } from "@/tools/image/add-text/lib/reducer";
import type { ImageResultItem } from "@/components/shared/ImageResultList";
import {
  createDefaultConfig,
  createDefaultOutput,
  type OutputSettings,
  type WatermarkConfig,
} from "./lib/config";

interface WatermarkContextValue {
  bitmap: ImageBitmap | null;
  naturalSize: ImageSize | null;
  sourceFile: File | null;
  config: WatermarkConfig;
  output: OutputSettings;
  loadError: string;
  results: ImageResultItem[];
  setConfig: (updater: (prev: WatermarkConfig) => WatermarkConfig) => void;
  setOutput: (updater: (prev: OutputSettings) => OutputSettings) => void;
  loadImage: (file: File) => Promise<void>;
  clearImage: () => void;
  addResult: (item: ImageResultItem) => void;
  removeResult: (index: number) => void;
}

const WatermarkContext = createContext<WatermarkContextValue | null>(null);

export function WatermarkProvider({ children }: { children: ReactNode }) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [naturalSize, setNaturalSize] = useState<ImageSize | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [config, setConfigState] = useState<WatermarkConfig>(createDefaultConfig);
  const [output, setOutputState] = useState<OutputSettings>(createDefaultOutput);
  const [loadError, setLoadError] = useState("");
  const [results, setResults] = useState<ImageResultItem[]>([]);
  const decodeTokenRef = useRef(0);

  // Own the base-image bitmap lifecycle: close the previous one only after
  // React commits the new bitmap, so a paint effect can't drawImage a closed
  // bitmap (mirrors add-text EditorContext).
  useEffect(() => {
    return () => {
      bitmap?.close();
    };
  }, [bitmap]);

  // Same ownership for the logo bitmap (replaced via setConfig / presets).
  useEffect(() => {
    const logo = config.image.bitmap;
    return () => {
      logo?.close();
    };
  }, [config.image.bitmap]);

  const loadImage = useCallback(async (file: File) => {
    const token = ++decodeTokenRef.current;
    setLoadError("");
    try {
      const bmp = await createImageBitmap(file);
      if (token !== decodeTokenRef.current) {
        bmp.close();
        return;
      }
      setSourceFile(file);
      setNaturalSize({ w: bmp.width, h: bmp.height });
      setBitmap(bmp);
    } catch {
      if (token === decodeTokenRef.current) {
        setLoadError("errLoadImage");
      }
    }
  }, []);

  const clearImage = useCallback(() => {
    decodeTokenRef.current++;
    setBitmap(null);
    setNaturalSize(null);
    setSourceFile(null);
    setLoadError("");
  }, []);

  const setConfig = useCallback(
    (updater: (prev: WatermarkConfig) => WatermarkConfig) => {
      setConfigState(updater);
    },
    [],
  );

  const setOutput = useCallback(
    (updater: (prev: OutputSettings) => OutputSettings) => {
      setOutputState(updater);
    },
    [],
  );

  const addResult = useCallback((item: ImageResultItem) => {
    setResults((prev) => [item, ...prev]);
  }, []);

  const removeResult = useCallback((index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const value = useMemo<WatermarkContextValue>(
    () => ({
      bitmap,
      naturalSize,
      sourceFile,
      config,
      output,
      loadError,
      results,
      setConfig,
      setOutput,
      loadImage,
      clearImage,
      addResult,
      removeResult,
    }),
    [
      bitmap,
      naturalSize,
      sourceFile,
      config,
      output,
      loadError,
      results,
      setConfig,
      setOutput,
      loadImage,
      clearImage,
      addResult,
      removeResult,
    ],
  );

  return (
    <WatermarkContext.Provider value={value}>
      {children}
    </WatermarkContext.Provider>
  );
}

export function useWatermark(): WatermarkContextValue {
  const ctx = useContext(WatermarkContext);
  if (!ctx) {
    throw new Error("useWatermark must be used inside WatermarkProvider");
  }
  return ctx;
}
