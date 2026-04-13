"use client";

import { useRef, useCallback } from "react";

const MIN_DURATION = 0.5;

export interface TimeRangeSliderProps {
  duration: number;
  startTime: number;
  endTime: number;
  minDuration?: number;
  onStartChange: (t: number) => void;
  onEndChange: (t: number) => void;
}

/**
 * Dual-thumb range slider for time selection.
 * Supports dragging start thumb, end thumb, and the range area to move the selection.
 */
export function TimeRangeSlider({
  duration,
  startTime,
  endTime,
  minDuration = MIN_DURATION,
  onStartChange,
  onEndChange,
}: TimeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"start" | "end" | "range" | null>(null);
  const dragOffsetRef = useRef(0);

  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 0;
  const rangePercent = endPercent - startPercent;

  const timeFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.max(0, Math.min(duration, ratio * duration));
    },
    [duration],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: "start" | "end" | "range") => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = type;
      if (type === "range") {
        const clickTime = timeFromPointer(e.clientX);
        dragOffsetRef.current = clickTime - startTime;
      }
    },
    [startTime, timeFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const time = timeFromPointer(e.clientX);

      if (draggingRef.current === "start") {
        onStartChange(Math.min(time, endTime - minDuration));
      } else if (draggingRef.current === "end") {
        onEndChange(Math.max(time, startTime + minDuration));
      } else if (draggingRef.current === "range") {
        const range = endTime - startTime;
        let newStart = time - dragOffsetRef.current;
        let newEnd = newStart + range;
        if (newStart < 0) {
          newStart = 0;
          newEnd = range;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - range;
        }
        onStartChange(newStart);
        onEndChange(newEnd);
      }
    },
    [duration, startTime, endTime, onStartChange, onEndChange, minDuration, timeFromPointer],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    if (m > 0) return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
    return `${s}.${ms}s`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatTime(startTime)}</span>
        <span className="font-medium text-foreground">
          {formatTime(endTime - startTime)}
        </span>
        <span>{formatTime(endTime)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />

        {/* Selected range */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary/30"
          style={{
            left: `${startPercent}%`,
            width: `${rangePercent}%`,
          }}
          onPointerDown={(e) => handlePointerDown(e, "range")}
        />

        {/* Start thumb */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${startPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, "start")}
        />

        {/* End thumb */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${endPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, "end")}
        />
      </div>
    </div>
  );
}
