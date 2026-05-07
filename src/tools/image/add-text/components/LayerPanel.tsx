"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditor } from "../EditorContext";
import { Button } from "@/components/ui/Button";

export function LayerPanel() {
  const { state, dispatch } = useEditor();
  const t = useTranslations("tools.image.add-text");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {t("layers")} ({state.layers.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: "ADD_LAYER" })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t("addText")}
        </Button>
      </div>

      {state.layers.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("noLayers")}</p>
      ) : (
        <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded border border-border">
          {state.layers
            .slice()
            .reverse()
            .map((layer) => (
              <li
                key={layer.id}
                className={`flex items-center gap-1 px-1.5 py-1 text-xs ${
                  state.selectedLayerId === layer.id
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <button
                  type="button"
                  title={layer.visible ? t("layerActions.hide") : t("layerActions.show")}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_LAYER",
                      payload: { id: layer.id, patch: { visible: !layer.visible } },
                    })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  title={layer.locked ? t("layerActions.unlock") : t("layerActions.lock")}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_LAYER",
                      payload: { id: layer.id, patch: { locked: !layer.locked } },
                    })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {layer.locked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: "SELECT_LAYER", payload: { id: layer.id } })
                  }
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {layer.text.split("\n")[0] || t("layerActions.empty")}
                </button>
                <button
                  type="button"
                  title={t("layerActions.moveUp")}
                  onClick={() =>
                    dispatch({
                      type: "REORDER_LAYER",
                      payload: { id: layer.id, direction: "up" },
                    })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={t("layerActions.moveDown")}
                  onClick={() =>
                    dispatch({
                      type: "REORDER_LAYER",
                      payload: { id: layer.id, direction: "down" },
                    })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={t("layerActions.duplicate")}
                  onClick={() =>
                    dispatch({ type: "DUPLICATE_LAYER", payload: { id: layer.id } })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title={t("layerActions.delete")}
                  onClick={() =>
                    dispatch({ type: "REMOVE_LAYER", payload: { id: layer.id } })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
