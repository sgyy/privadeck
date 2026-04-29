"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WaveformSelectorProps {
  audioBuffer: AudioBuffer | null;
  start: number;
  end: number;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  height?: number;
}

export function WaveformSelector({
  audioBuffer,
  start,
  end,
  currentTime,
  duration,
  onSeek,
  height = 96,
}: WaveformSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer || containerWidth <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = containerWidth;
    // Cap the backing-store size: high-DPR phones with wide containers can
    // otherwise blow past Safari's 4096×4096 MAX_CANVAS_AREA (getContext
    // returns null) or eat ~4 MB+ per canvas with no visible benefit.
    const MAX_PX = 4096;
    const MAX_PY = 1024;
    canvas.width = Math.min(Math.floor(w * dpr), MAX_PX);
    canvas.height = Math.min(Math.floor(height * dpr), MAX_PY);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Use the *actual* scaling ratio (which equals dpr unless capped),
    // otherwise the right edge of the waveform is clipped at high DPR + wide
    // containers because the drawing loop uses logical coords up to `w`.
    const scaleX = canvas.width / w;
    const scaleY = canvas.height / height;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, w, height);

    const channelCount = audioBuffer.numberOfChannels;
    const half = height / 2;
    const samplesPerPixel = Math.max(1, Math.floor(audioBuffer.length / w));

    const fillColor = getComputedStyle(canvas).color || "#06B6D4";
    ctx.fillStyle = fillColor;

    for (let x = 0; x < w; x++) {
      const samStart = x * samplesPerPixel;
      let min = 1;
      let max = -1;
      for (let c = 0; c < channelCount; c++) {
        const data = audioBuffer.getChannelData(c);
        const eIdx = Math.min(samStart + samplesPerPixel, data.length);
        for (let i = samStart; i < eIdx; i++) {
          const v = data[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      const yMax = (1 - max) * half;
      const yMin = (1 - min) * half;
      ctx.fillRect(x, yMax, 1, Math.max(1, yMin - yMax));
    }

    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, half);
    ctx.lineTo(w, half);
    ctx.stroke();
  }, [audioBuffer, containerWidth, height]);

  // Default to 0 (not 100) when duration is unknown — otherwise the moment
  // before audio metadata arrives shows the entire bar as "selected".
  const startPercent = duration > 0 ? Math.max(0, Math.min(100, (start / duration) * 100)) : 0;
  const endPercent = duration > 0 ? Math.max(0, Math.min(100, (end / duration) * 100)) : 0;
  const playheadPercent = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
  const showPlayhead = duration > 0 && currentTime >= 0 && currentTime <= duration;

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!onSeek || !containerRef.current || duration <= 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek],
  );

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none text-primary"
      style={{ height }}
      onPointerDown={onSeek ? handlePointer : undefined}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-background/70"
        style={{ width: `${startPercent}%` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 bg-background/70"
        style={{ left: `${endPercent}%`, right: 0 }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 border-x-2 border-primary/60"
        style={{
          left: `${startPercent}%`,
          width: `${Math.max(0, endPercent - startPercent)}%`,
        }}
      />
      {showPlayhead && (
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-primary shadow-[0_0_4px_rgba(6,182,212,0.8)]"
          style={{ left: `${playheadPercent}%` }}
        />
      )}
    </div>
  );
}
