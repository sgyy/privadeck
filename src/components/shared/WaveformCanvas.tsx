"use client";

import { useEffect, useRef, useState } from "react";

interface WaveformCanvasProps {
  audioBuffer: AudioBuffer | null;
  gain?: number;
  height?: number;
  className?: string;
}

export function WaveformCanvas({
  audioBuffer,
  gain = 1,
  height = 80,
  className,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setContainerWidth(w);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer || containerWidth <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = containerWidth;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const channelCount = audioBuffer.numberOfChannels;
    const half = height / 2;
    const samplesPerPixel = Math.max(1, Math.floor(audioBuffer.length / width));

    const color = getComputedStyle(canvas).color || "#06B6D4";
    ctx.fillStyle = color;

    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      let min = 1;
      let max = -1;
      for (let c = 0; c < channelCount; c++) {
        const data = audioBuffer.getChannelData(c);
        const end = Math.min(start + samplesPerPixel, data.length);
        for (let i = start; i < end; i++) {
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
    ctx.lineTo(width, half);
    ctx.stroke();
  }, [audioBuffer, containerWidth, height]);

  const safeGain = Math.max(0, Math.min(gain, 4));

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          transform: `scaleY(${safeGain})`,
          transformOrigin: "center",
          transition: "transform 80ms ease-out",
        }}
      />
    </div>
  );
}
