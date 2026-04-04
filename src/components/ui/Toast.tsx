import { cn } from "@/lib/utils/cn";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let toasts: ToastData[] = [];
let listeners: Array<(toasts: ToastData[]) => void> = [];
let nextId = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

function addToast(type: ToastType, message: string, duration = 3000) {
  const id = `toast-${nextId++}`;
  toasts = [...toasts, { id, type, message, duration }];
  notify();
  if (duration > 0) {
    const timer = setTimeout(() => removeToast(id), duration);
    timers.set(id, timer);
  }
  return id;
}

function removeToast(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (message: string, duration?: number) => addToast("success", message, duration),
  error: (message: string, duration?: number) => addToast("error", message, duration),
  info: (message: string, duration?: number) => addToast("info", message, duration),
  warning: (message: string, duration?: number) => addToast("warning", message, duration),
  dismiss: removeToast,
};

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState(toasts);
  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      listeners = listeners.filter((fn) => fn !== setCurrentToasts);
    };
  }, []);
  return { toasts: currentToasts, dismiss: removeToast };
}

const typeConfig: Record<ToastType, { icon: React.ComponentType<{ className?: string }>; bg: string; border: string }> = {
  success: { icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-200 dark:border-emerald-800" },
  error: { icon: XCircle, bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-800" },
  info: { icon: Info, bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-200 dark:border-blue-800" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-800" },
};

export function ToastContainer() {
  const { toasts: currentToasts, dismiss } = useToast();

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {currentToasts.map((t) => {
        const config = typeConfig[t.type];
        const Icon = config.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-fade-in-scale",
              config.bg,
              config.border,
            )}
            role="alert"
          >
            <Icon className={cn("h-5 w-5 shrink-0", {
              "text-emerald-600 dark:text-emerald-400": t.type === "success",
              "text-red-600 dark:text-red-400": t.type === "error",
              "text-blue-600 dark:text-blue-400": t.type === "info",
              "text-amber-600 dark:text-amber-400": t.type === "warning",
            })} />
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
