"use client";

import { useState, useCallback, useRef } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";

type FFmpegStatus = "idle" | "loading" | "ready" | "error";

export function useFFmpeg() {
  const [status, setStatus] = useState<FFmpegStatus>("idle");
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const statusRef = useRef<FFmpegStatus>("idle");

  const load = useCallback(async () => {
    if (statusRef.current === "ready" && ffmpeg) return ffmpeg;
    if (statusRef.current === "loading") return null;

    statusRef.current = "loading";
    setStatus("loading");
    try {
      const { getFFmpeg } = await import("@/lib/ffmpeg");
      const instance = await getFFmpeg();
      setFfmpeg(instance);
      statusRef.current = "ready";
      setStatus("ready");
      return instance;
    } catch {
      statusRef.current = "error";
      setStatus("error");
      return null;
    }
  }, [ffmpeg]);

  return { status, ffmpeg, load };
}
