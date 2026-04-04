"use client";

import { X } from "lucide-react";
import { Dialog, DialogOverlay, DialogContent } from "@/components/ui/Dialog";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = "", onClose }: ImageLightboxProps) {
  return (
    <Dialog open={true} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogOverlay className="bg-black/80" />
      <DialogContent className="items-center justify-center bg-transparent p-0">
        <div className="relative flex h-full w-full items-center justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 z-[60] rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
