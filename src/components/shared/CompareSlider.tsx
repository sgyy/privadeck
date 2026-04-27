"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

interface CompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  savedPercent?: number;
  width?: number;
  height?: number;
}

export function CompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  savedPercent,
  width,
  height,
}: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");

  const handleMove = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      containerRef.current?.setPointerCapture(e.pointerId);
      handleMove(e.clientX);
    },
    [handleMove],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons === 0) return;
      handleMove(e.clientX);
    },
    [handleMove],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 2));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 2));
    }
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden rounded-lg border border-border"
        style={{
          cursor: "col-resize",
          ...(width && height ? { aspectRatio: `${width}/${height}` } : {}),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        role="group"
        aria-label={t("compareSlider")}
      >
        {/* After image (full width, behind) */}
        <img
          src={afterSrc}
          alt={afterLabel || t("compareAfter")}
          className="block w-full"
          draggable={false}
          width={width}
          height={height}
          decoding="async"
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeLabel || t("compareBefore")}
            className="block w-full"
            draggable={false}
            width={width}
            height={height}
            decoding="async"
          />
        </div>

        {/* Labels */}
        <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          {beforeLabel || t("compareBefore")}
        </span>
        <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          {afterLabel || t("compareAfter")}
        </span>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div
            ref={handleRef}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}%`}
            aria-label={t("compareSlider")}
            tabIndex={0}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 cursor-col-resize items-center justify-center rounded-full bg-white shadow-md"
            onKeyDown={handleKeyDown}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 3L2 8L5 13" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 3L14 8L11 13" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {savedPercent !== undefined && savedPercent > 0 && (
        <p className="text-center text-sm font-medium text-accent-foreground">
          {t("compareSaved", { percent: savedPercent })}
        </p>
      )}
    </div>
  );
}
