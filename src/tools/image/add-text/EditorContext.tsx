"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  editorReducer,
  initialState,
  type Action,
  type EditorState,
  type TextLayer,
} from "./lib/reducer";

export interface SystemFont {
  /** Synthetic key prefixed with `__sys-` so it never collides with FONT_REGISTRY or user fonts. */
  key: string;
  family: string;
}

export type LoadSystemFontsResult =
  | { ok: true; count: number }
  | { ok: false; reason: "unsupported" | "denied" | "error" };

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<Action>;
  selectedLayer: TextLayer | null;
  canUndo: boolean;
  canRedo: boolean;
  updateSelected: (patch: Partial<TextLayer>) => void;
  /** Set by EditorCanvas during pointer drags. While true, the auto-commit
   * debounce skips snapshotting so the explicit pointerup COMMIT_HISTORY is
   * the sole source of history for that drag. */
  isDraggingRef: React.MutableRefObject<boolean>;
  /** Browser-discovered local system fonts. Populated only after the user
   * grants permission via `loadSystemFonts`. Never persisted; never sent
   * anywhere. */
  systemFonts: SystemFont[];
  loadSystemFonts: () => Promise<LoadSystemFontsResult>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

const HISTORY_DEBOUNCE_MS = 600;

function layersEqual(a: TextLayer[], b: TextLayer[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
  }
  return true;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const lastCommittedRef = useRef<TextLayer[]>(state.layers);
  const isDraggingRef = useRef(false);
  const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);

  // Own the ImageBitmap lifecycle: close the previous one only after React has
  // committed the new bitmap to the tree. Closing synchronously in the click
  // handler creates a window where EditorCanvas's paint effect could call
  // drawImage on an already-closed bitmap.
  useEffect(() => {
    const bitmap = state.imageBitmap;
    return () => {
      bitmap?.close();
    };
  }, [state.imageBitmap]);

  // Sync lastCommitted whenever the history past/future stack mutates explicitly
  // (i.e. an action that pushed or popped history). This covers undo/redo and
  // mouseup/COMMIT_HISTORY paths.
  useEffect(() => {
    lastCommittedRef.current = state.layers;
    // We intentionally key on history identity, not layers. After undo/redo,
    // history references change and we want to rebase lastCommitted to the
    // restored layers.
  }, [state.history]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-commit: debounce non-drag edits (typing, sliders) into history.
  // Skips entirely while a drag is in flight — the pointerup handler is the
  // sole source of history for that drag, avoiding a double-push race.
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (layersEqual(lastCommittedRef.current, state.layers)) return;
    const timer = setTimeout(() => {
      if (isDraggingRef.current) return;
      if (!layersEqual(lastCommittedRef.current, state.layers)) {
        dispatch({
          type: "COMMIT_HISTORY",
          payload: { snapshot: lastCommittedRef.current },
        });
        lastCommittedRef.current = state.layers;
      }
    }, HISTORY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.layers]);

  const selectedLayer = useMemo(
    () => state.layers.find((l) => l.id === state.selectedLayerId) ?? null,
    [state.layers, state.selectedLayerId],
  );

  const updateSelected = useCallback(
    (patch: Partial<TextLayer>) => {
      if (!state.selectedLayerId) return;
      dispatch({
        type: "UPDATE_LAYER",
        payload: { id: state.selectedLayerId, patch },
      });
    },
    [state.selectedLayerId],
  );

  const loadSystemFonts = useCallback(async (): Promise<LoadSystemFontsResult> => {
    if (typeof window === "undefined") return { ok: false, reason: "unsupported" };
    // Local Font Access API — Chrome/Edge 103+. Firefox / Safari have no
    // implementation as of 2026-05.
    const queryFn = (window as unknown as {
      queryLocalFonts?: () => Promise<Array<{ family: string }>>;
    }).queryLocalFonts;
    if (typeof queryFn !== "function") return { ok: false, reason: "unsupported" };
    try {
      const fonts = await queryFn();
      // Dedup by family — `queryLocalFonts` returns one entry per face
      // (Bold, Italic, BoldItalic...) but the picker only needs the family.
      const seen = new Set<string>();
      const unique: SystemFont[] = [];
      for (const f of fonts) {
        if (!f.family || seen.has(f.family)) continue;
        seen.add(f.family);
        unique.push({ key: `__sys-${f.family}`, family: f.family });
      }
      unique.sort((a, b) => a.family.localeCompare(b.family));
      setSystemFonts(unique);
      return { ok: true, count: unique.length };
    } catch (e) {
      // The spec rejects with NotAllowedError on permission denial. Anything
      // else (SecurityError, TypeError) we surface as a generic error.
      const name = (e as { name?: string } | null)?.name;
      return { ok: false, reason: name === "NotAllowedError" ? "denied" : "error" };
    }
  }, []);

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      dispatch,
      selectedLayer,
      canUndo: state.history.past.length > 0,
      canRedo: state.history.future.length > 0,
      updateSelected,
      isDraggingRef,
      systemFonts,
      loadSystemFonts,
    }),
    [
      state,
      selectedLayer,
      updateSelected,
      systemFonts,
      loadSystemFonts,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
