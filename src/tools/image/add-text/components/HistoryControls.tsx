"use client";

import { useEffect } from "react";
import { Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";

export function HistoryControls() {
  const { canUndo, canRedo, dispatch, state } = useEditor();
  const t = useTranslations("tools.image.add-text");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "REDO" : "UNDO" });
      } else if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        dispatch({ type: "REDO" });
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isInput &&
        state.selectedLayerId
      ) {
        e.preventDefault();
        dispatch({
          type: "REMOVE_LAYER",
          payload: { id: state.selectedLayerId },
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, state.selectedLayerId]);

  return (
    <div className="flex gap-1">
      <button
        type="button"
        title={t("history.undo")}
        disabled={!canUndo}
        onClick={() => dispatch({ type: "UNDO" })}
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={t("history.redo")}
        disabled={!canRedo}
        onClick={() => dispatch({ type: "REDO" })}
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40"
      >
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  );
}
