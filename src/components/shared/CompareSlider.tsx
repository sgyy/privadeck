"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

interface CompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  savedPercent?: number;
}

export function CompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  savedPercent,
}: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden rounded-lg border border-border"
        style={{ cursor: "col-resize" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* After image (full width, behind) */}
        <img
          src={afterSrc}
          alt={afterLabel || t("compareAfter")}
          className="block w-full"
          draggable={false}
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeLabel || t("compareBefore")}
            className="block w-full h-full object-cover"
            draggable={false}
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 3L2 8L5 13" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 3L14 8L11 13" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {savedPercent !== undefined && savedPercent > 0 && (
        <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {t("compareSaved", { percent: savedPercent })}
        </p>
      )}
    </div>
  );
}
