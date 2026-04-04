import { useEffect, useRef, useCallback } from "react";

export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, enabled = true) {
  const previousActiveElement = useRef<Element | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;

    if (e.key !== "Tab") return;

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null,
    );

    if (focusable.length === 0) {
      e.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [containerRef]);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    previousActiveElement.current = document.activeElement;

    container.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => {
      const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null,
      );
      if (focusable.length > 0) focusable[0].focus();
    });

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      const prev = previousActiveElement.current;
      if (prev instanceof HTMLElement) {
        prev.focus();
      }
    };
  }, [containerRef, enabled, handleKeyDown]);
}
