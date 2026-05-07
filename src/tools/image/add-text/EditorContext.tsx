"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      dispatch,
      selectedLayer,
      canUndo: state.history.past.length > 0,
      canRedo: state.history.future.length > 0,
      updateSelected,
      isDraggingRef,
    }),
    [state, selectedLayer, updateSelected],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
