"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { jsonrepair } from "jsonrepair";
import {
  Check,
  Copy,
  Download,
  Eraser,
  FileCode2,
  Eye,
  Redo2,
  TreePine,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MonacoJsonEditor } from "../json-formatter/MonacoEditor";
import { SyntaxHighlight } from "../json-formatter/SyntaxHighlight";
import { TextDropZone } from "@/components/shared/TextDropZone";
import { createToolTracker } from "@/lib/analytics";
import { EditableJsonTree } from "./EditableJsonTree";
import { useEditorHistory } from "./useEditorHistory";
import { type JsonValue, type Path, pathToString, smartFormat } from "./logic";

const tracker = createToolTracker("json-editor", "developer");
const INITIAL: JsonValue = {};

type ViewMode = "text" | "tree" | "preview";

export default function JsonEditor() {
  const t = useTranslations("tools.developer.json-editor");
  const tc = useTranslations("common");

  const history = useEditorHistory<JsonValue>(INITIAL);
  const [textOverride, setTextOverride] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<Path>([]);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("text");
  const [switchHint, setSwitchHint] = useState<string | null>(null);

  const text = useMemo(
    () => textOverride ?? JSON.stringify(history.state, null, 2),
    [textOverride, history.state],
  );
  const parseError = useMemo<string | null>(() => {
    if (textOverride === null) return null;
    try { JSON.parse(textOverride); return null; }
    catch (e) { return (e as Error).message; }
  }, [textOverride]);
  const canRepair = parseError !== null;

  const isRootEmpty = useMemo(() => {
    const s = history.state;
    if (Array.isArray(s)) return s.length === 0;
    if (s !== null && typeof s === "object") return Object.keys(s).length === 0;
    return false;
  }, [history.state]);

  const historySet = history.set;
  const historyReset = history.reset;
  const historyUndo = history.undo;
  const historyRedo = history.redo;

  const applyText = useCallback((next: string): boolean => {
    try {
      const parsed = JSON.parse(next) as JsonValue;
      historySet(parsed);
      setTextOverride(null);
      return true;
    } catch {
      setTextOverride(next);
      return false;
    }
  }, [historySet]);

  const handleTextChange = useCallback((next: string) => {
    setTextOverride(next);
    setSwitchHint(null);
  }, []);

  const handleRepair = useCallback(() => {
    try {
      const repaired = jsonrepair(text);
      const parsed = JSON.parse(repaired) as JsonValue;
      historySet(parsed);
      setTextOverride(null);
      tracker.trackProcessComplete(0);
    } catch (e) {
      tracker.trackProcessError((e as Error).message);
    }
  }, [text, historySet]);

  const handleTreeChange = useCallback((next: JsonValue) => {
    historySet(next);
    setTextOverride(null);
  }, [historySet]);

  const handleFormat = useCallback(() => {
    if (textOverride !== null) applyText(textOverride);
    else setTextOverride(null);
  }, [applyText, textOverride]);

  const handleMinify = useCallback(() => {
    if (textOverride !== null) {
      try {
        const parsed = JSON.parse(textOverride) as JsonValue;
        historySet(parsed);
        setTextOverride(JSON.stringify(parsed));
      } catch { /* keep invalid textOverride as-is */ }
      return;
    }
    setTextOverride(JSON.stringify(history.state));
  }, [historySet, history.state, textOverride]);

  const handleSmart = useCallback(() => {
    if (textOverride !== null) {
      try {
        const parsed = JSON.parse(textOverride) as JsonValue;
        historySet(parsed);
        setTextOverride(smartFormat(parsed));
      } catch { /* keep invalid textOverride as-is */ }
      return;
    }
    setTextOverride(smartFormat(history.state));
  }, [historySet, history.state, textOverride]);

  const handleClear = useCallback(() => {
    historyReset({});
    setTextOverride(null);
    setSelectedPath([]);
    setSwitchHint(null);
  }, [historyReset]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited.json";
    a.click();
    URL.revokeObjectURL(url);
    tracker.trackProcessComplete(0);
  }, [text]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleCopyPath = useCallback(async () => {
    try { await navigator.clipboard.writeText(pathToString(selectedPath)); } catch { /* noop */ }
  }, [selectedPath]);

  const switchView = useCallback((target: ViewMode) => {
    if (target === view) return;
    // Leaving text with pending changes: try to apply; if invalid, stay
    if (view === "text" && textOverride !== null) {
      const ok = applyText(textOverride);
      if (!ok) {
        setSwitchHint(t("switchBlockedInvalid"));
        return;
      }
    }
    setSwitchHint(null);
    setView(target);
  }, [applyText, t, textOverride, view]);

  // Global keyboard shortcuts: undo/redo (Ctrl+Z/Y)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        historyUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        historyRedo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [historyUndo, historyRedo]);

  const labels = useMemo(() => ({
    addChild: t("menu.addChild"),
    typeString: t("type.string"),
    typeNumber: t("type.number"),
    typeBoolean: t("type.boolean"),
    typeNull: t("type.null"),
    typeObject: t("type.object"),
    typeArray: t("type.array"),
    menuEdit: t("menu.edit"),
    menuDuplicate: t("menu.duplicate"),
    menuDelete: t("menu.delete"),
    menuInsertBefore: t("menu.insertBefore"),
    menuInsertAfter: t("menu.insertAfter"),
    menuAppendChild: t("menu.appendChild"),
    menuChangeType: t("menu.changeType"),
    menuCopyPath: t("menu.copyPath"),
    items: t.raw("items") as string,
  }), [t]);

  const editorHeight = "calc(70vh - 140px)";

  return (
    <div className="flex flex-col gap-2">
      {/* Auto-repair banner */}
      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-red-700 dark:text-red-400 break-all">{parseError}</span>
            {canRepair && (
              <Button variant="outline" size="sm" onClick={handleRepair} className="shrink-0">
                <Wand2 className="h-3.5 w-3.5 mr-1" />
                {t("autoRepair")}
              </Button>
            )}
          </div>
        </div>
      )}

      {switchHint && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {switchHint}
        </div>
      )}

      {/* Top toolbar: view switcher + actions */}
      <div className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 flex flex-wrap items-center gap-1.5">
        {/* View mode segmented control */}
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <ViewButton
            active={view === "text"}
            onClick={() => switchView("text")}
            icon={<FileCode2 className="h-3.5 w-3.5" />}
            label={t("viewText")}
          />
          <ViewButton
            active={view === "tree"}
            onClick={() => switchView("tree")}
            icon={<TreePine className="h-3.5 w-3.5" />}
            label={t("viewTree")}
          />
          <ViewButton
            active={view === "preview"}
            onClick={() => switchView("preview")}
            icon={<Eye className="h-3.5 w-3.5" />}
            label={t("viewPreview")}
          />
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button variant="ghost" size="sm" onClick={() => history.undo()} disabled={!history.canUndo} title={t("undo")}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => history.redo()} disabled={!history.canRedo} title={t("redo")}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
          onClick={handleFormat}
        >
          {t("format")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
          onClick={handleMinify}
        >
          {t("minify")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
          onClick={handleSmart}
          title={t("smartFormatHint")}
        >
          {t("smartFormat")}
        </Button>

        <div className="ml-auto flex items-center gap-1">
          {parseError ? (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <X className="h-3.5 w-3.5" />
              {t("invalid")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3.5 w-3.5" />
              {t("valid")}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleClear} title={t("clear")}>
            <Eraser className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} title={tc("download")}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} title={copied ? tc("copied") : tc("copy")}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Single editing area */}
      <TextDropZone
        onTextLoaded={(content) => { applyText(content); }}
        accept={[".json", ".txt"]}
        isEmpty={!textOverride && isRootEmpty}
      >
        {({ dropClassName }) => (
          <div
            className={`rounded-lg border border-border overflow-hidden ${dropClassName}`}
            style={{ minHeight: 300 }}
          >
            {/* Monaco stays mounted across view switches to preserve
                scroll / cursor / lazy-loaded editor state. */}
            <div style={{ display: view === "text" ? "block" : "none" }}>
              <MonacoJsonEditor
                value={text}
                onChange={handleTextChange}
                height={editorHeight}
                loadingText={t("loadingEditor")}
              />
            </div>

            {view === "tree" && (
              <div className="p-3 overflow-auto" style={{ maxHeight: editorHeight }}>
                {parseError ? (
                  <div className="text-sm text-muted-foreground italic py-4">
                    {t("treeDisabledBanner")}
                  </div>
                ) : (
                  <EditableJsonTree
                    data={history.state}
                    onChange={handleTreeChange}
                    onPathSelect={setSelectedPath}
                    labels={labels}
                  />
                )}
              </div>
            )}

            {view === "preview" && (
              <div className="p-3 overflow-auto" style={{ maxHeight: editorHeight }}>
                {parseError ? (
                  <div className="text-sm text-muted-foreground italic py-4">
                    {t("treeDisabledBanner")}
                  </div>
                ) : text ? (
                  <SyntaxHighlight code={text} />
                ) : (
                  <div className="text-sm text-muted-foreground italic py-4">
                    {t("emptyPreview")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </TextDropZone>

      {/* Bottom status bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <span className="truncate font-mono" title={pathToString(selectedPath)}>
          {pathToString(selectedPath)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyPath}
          title={t("menu.copyPath")}
          className="h-6 px-1.5"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <span className="ml-auto">{view === "tree" ? t("treeHint") : view === "text" ? t("textHint") : t("previewHint")}</span>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center gap-1 px-2.5 py-1 text-xs border-r border-border last:border-r-0 transition-colors " +
        (active
          ? "bg-primary text-primary-foreground"
          : "bg-background hover:bg-muted text-foreground")
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
