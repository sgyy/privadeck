"use client";

import { createContext, useContext, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFocusTrap } from "@/lib/utils/focusTrap";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within Dialog");
  return ctx;
}

let openCount = 0;

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = useId();
  const didOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      openCount++;
      didOpenRef.current = true;
      if (openCount === 1) {
        document.body.style.overflow = "hidden";
      }
    }
    return () => {
      if (didOpenRef.current) {
        openCount--;
        if (openCount <= 0) {
          openCount = 0;
          document.body.style.overflow = "";
        }
        didOpenRef.current = false;
      }
    };
  }, [open]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange, titleId }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogOverlayProps {
  className?: string;
}

export function DialogOverlay({ className }: DialogOverlayProps) {
  const { open, onOpenChange } = useDialogContext();
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in",
        className,
      )}
      onClick={() => onOpenChange(false)}
      aria-hidden="true"
    />
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DialogContent({ children, className, onClose }: DialogContentProps) {
  const { open, onOpenChange, titleId } = useDialogContext();
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, open);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-scale",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function DialogTitle({ children, className, id }: DialogTitleProps) {
  const { titleId } = useDialogContext();
  return (
    <h2
      id={id ?? titleId}
      className={cn("text-lg font-semibold", className)}
    >
      {children}
    </h2>
  );
}

interface DialogCloseProps {
  className?: string;
  "aria-label"?: string;
}

export function DialogClose({ className, "aria-label": ariaLabel }: DialogCloseProps) {
  const { onOpenChange } = useDialogContext();
  return (
    <button
      type="button"
      className={cn(
        "rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
      onClick={() => onOpenChange(false)}
      aria-label={ariaLabel ?? "Close"}
    >
      <X className="h-5 w-5" />
    </button>
  );
}
