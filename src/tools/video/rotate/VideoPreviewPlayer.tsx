"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface VideoPreviewPlayerProps {
  src: string;
  transform?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPreviewPlayer({ src, transform, className }: VideoPreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    setPlaying(false);
    setMuted(false);
    setSeeking(false);
  }, [src]);

  // Sync muted state
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setSeeking((isSeeking) => {
      if (!isSeeking) {
        setCurrentTime(v.currentTime);
      }
      return isSeeking;
    });
  }, []);

  const handleDurationChange = useCallback(() => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }, []);

  const handlePlay = useCallback(() => setPlaying(true), []);
  const handlePause = useCallback(() => setPlaying(false), []);

  const handleSeekStart = useCallback(() => {
    setSeeking(true);
  }, []);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number(e.target.value);
      setCurrentTime(time);
      const v = videoRef.current;
      if (v) v.currentTime = time;
    },
    [],
  );

  const handleSeekEnd = useCallback(() => {
    setSeeking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
  }, []);

  return (
    <div className={cn("group relative", className)}>
      {/* Video container with transform - only video content rotates */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-t-lg bg-black"
        style={{ minHeight: "200px" }}
      >
        <div
          className="transition-transform duration-300 ease-in-out"
          style={transform ? { transform, maxWidth: "100%", maxHeight: "400px" } : { maxWidth: "100%", maxHeight: "400px" }}
        >
          <video
            ref={videoRef}
            src={src}
            className="max-h-[400px] w-full cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onLoadedMetadata={handleDurationChange}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
          />
        </div>

        {/* Play overlay when paused */}
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
              <Play className="ml-1 h-7 w-7 text-gray-900" fill="currentColor" />
            </div>
          </button>
        )}
      </div>

      {/* Controls bar - always upright */}
      <div className="flex items-center gap-2 border-t border-border/50 bg-card/80 px-3 py-2 backdrop-blur-sm">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        {/* Time display */}
        <span className="flex-shrink-0 text-xs font-mono text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          className="min-w-0 flex-1 cursor-pointer accent-primary"
          style={{ height: "4px" }}
        />

        {/* Mute */}
        <button
          type="button"
          onClick={toggleMute}
          className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
