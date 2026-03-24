"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = "", onClose }: ImageLightboxProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <button
        ref={closeBtnRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
