"use client";

import { useCallback, useState } from "react";

const MAX_HISTORY = 50;

export interface EditorHistory<T> {
  state: T;
  set: (next: T) => void;
  replace: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (next: T) => void;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useEditorHistory<T>(initial: T): EditorHistory<T> {
  const [h, setH] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });

  const set = useCallback((next: T) => {
    setH((cur) => {
      const past = [...cur.past, cur.present];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, present: next, future: [] };
    });
  }, []);

  const replace = useCallback((next: T) => {
    setH((cur) => ({ ...cur, present: next }));
  }, []);

  const undo = useCallback(() => {
    setH((cur) => {
      if (cur.past.length === 0) return cur;
      const past = cur.past.slice(0, -1);
      const prev = cur.past[cur.past.length - 1];
      return { past, present: prev, future: [...cur.future, cur.present] };
    });
  }, []);

  const redo = useCallback(() => {
    setH((cur) => {
      if (cur.future.length === 0) return cur;
      const future = cur.future.slice(0, -1);
      const next = cur.future[cur.future.length - 1];
      return { past: [...cur.past, cur.present], present: next, future };
    });
  }, []);

  const reset = useCallback((next: T) => {
    setH({ past: [], present: next, future: [] });
  }, []);

  return {
    state: h.present,
    set,
    replace,
    undo,
    redo,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    reset,
  };
}
