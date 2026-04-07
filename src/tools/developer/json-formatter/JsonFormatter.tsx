"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { formatJson, minifyJson, validateJson, type JsonResult } from "./logic";
import { createToolTracker } from "@/lib/analytics";
import { MonacoJsonEditor } from "./MonacoEditor";
import { JsonTreeView } from "./JsonTreeView";
import { SyntaxHighlight } from "./SyntaxHighlight";
import { TextDropZone } from "@/components/shared/TextDropZone";
import { Check, X, Eraser, Download, Copy } from "lucide-react";

const tracker = createToolTracker("json-formatter", "developer");

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedData, setParsedData] = useState<unknown>(undefined);
  const [result, setResult] = useState<JsonResult | null>(null);
  const [indent, setIndent] = useState<number>(2);
  const [jsonPath, setJsonPath] = useState("");
  const [treeKey, setTreeKey] = useState(0);
  const [treeExpandLevel, setTreeExpandLevel] = useState(2);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("tools.developer.json-formatter");
  const tc = useTranslations("common");

  const resetExpandState = useCallback(() => {
    setTreeExpandLevel(2);
    setTreeKey((k) => k + 1);
  }, []);

  const handleFormat = useCallback(() => {
    const start = performance.now();
    const r = formatJson(input, indent);
    setResult(r);
    setOutput(r.output);
    if (r.valid) {
      setInput(r.output);
      tracker.trackProcessComplete(Math.round(performance.now() - start));
    } else {
      tracker.trackProcessError(r.error ?? "Format failed");
    }
    if (r.parsed !== undefined) setParsedData(r.parsed);
    resetExpandState();
  }, [input, indent, resetExpandState]);

  const handleMinify = useCallback(() => {
    const start = performance.now();
    const r = minifyJson(input);
    setResult(r);
    setOutput(r.output);
    if (r.valid) {
      setInput(r.output);
      tracker.trackProcessComplete(Math.round(performance.now() - start));
    } else {
      tracker.trackProcessError(r.error ?? "Minify failed");
    }
    if (r.parsed !== undefined) setParsedData(r.parsed);
    resetExpandState();
  }, [input, resetExpandState]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setParsedData(undefined);
    setResult(null);
    setJsonPath("");
    resetExpandState();
  }, [resetExpandState]);

  const handleIndentChange = useCallback(
    (newIndent: number) => {
      setIndent(newIndent);
      if (input.trim()) {
        const r = formatJson(input, newIndent);
        setResult(r);
        setOutput(r.output);
        if (r.valid) setInput(r.output);
        if (r.parsed !== undefined) setParsedData(r.parsed);
        resetExpandState();
      }
    },
    [input, resetExpandState],
  );

  const handleExpandAll = useCallback(() => {
    setTreeExpandLevel(999);
    setTreeKey((k) => k + 1);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setTreeExpandLevel(0);
    setTreeKey((k) => k + 1);
  }, []);

  // Validate on input change — suppress error details during editing
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (value.trim()) {
        const r = validateJson(value);
        setResult(r.valid ? r : { output: r.output, valid: false });
        if (r.valid && r.parsed !== undefined) {
          setParsedData(r.parsed);
          setOutput(JSON.stringify(r.parsed, null, indent));
        }
      } else {
        setResult(null);
        setParsedData(undefined);
        setOutput("");
      }
    },
    [indent],
  );

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(input); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [input]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([input], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [input]);

  // Drag logic for split pane
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const ratio = (clientX - rect.left) / rect.width;
      setSplitRatio(Math.min(0.8, Math.max(0.2, ratio)));
    };
    const handleUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, [isDragging]);

  const hasOutput = output && parsedData !== undefined;
  const editorHeight = "calc(70vh - 120px)";

  return (
    <div className="flex flex-col gap-3">
      {/* Error banner */}
      {result && !result.valid && result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400 break-all">
          {result.error}
        </div>
      )}

      {/* Split pane: stacked on mobile, side-by-side on md+ */}
      <div
        ref={containerRef}
        className="flex flex-col md:flex-row gap-4 md:gap-0"
      >
        {/* Left panel: Monaco Editor */}
        <div
          className="min-w-0 md:pr-0"
          style={{ flex: `0 0 ${splitRatio * 100}%` }}
        >
          <TextDropZone
            onTextLoaded={(text) => handleInputChange(text)}
            accept={[".json", ".txt"]}
            isEmpty={!input}
          >
            {({ dropClassName }) => (
              <div className={`rounded-lg border border-border overflow-hidden ${dropClassName}`} style={{ minHeight: 250 }}>
                {/* Left toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5 bg-muted/30">
                  <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary" onClick={handleFormat} disabled={!input.trim()}>
                    {t("format")}
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary" onClick={handleMinify} disabled={!input.trim()}>
                    {t("minify")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear} disabled={!input} title={t("clear")}>
                    <Eraser className="h-3.5 w-3.5" />
                  </Button>
                  {input && (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleDownload} title={tc("download")}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCopy} title={copied ? tc("copied") : tc("copy")}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {result && (
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          result.valid ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {result.valid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {result.valid ? t("valid") : t("invalid")}
                      </span>
                    )}
                    <select
                      value={indent}
                      onChange={(e) => handleIndentChange(Number(e.target.value))}
                      className="h-7 rounded border border-border bg-background px-1.5 text-xs"
                    >
                      <option value={2}>2</option>
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                    </select>
                  </div>
                </div>
                <div style={{ pointerEvents: isDragging ? "none" : undefined }}>
                  <MonacoJsonEditor
                    value={input}
                    onChange={handleInputChange}
                    height={editorHeight}
                    loadingText={t("loadingEditor")}
                  />
                </div>
              </div>
            )}
          </TextDropZone>
        </div>

        {/* Draggable divider — hidden on mobile */}
        <div
          className="hidden md:flex items-center justify-center w-3 shrink-0 cursor-col-resize group select-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDoubleClick={() => setSplitRatio(0.5)}
        >
          <div className={`w-1 h-12 rounded-full transition-colors ${
            isDragging ? "bg-primary" : "bg-border group-hover:bg-primary/60"
          }`} />
        </div>

        {/* Right panel: Tree / Code view */}
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-border overflow-hidden flex flex-col h-full">
            {/* Right toolbar */}
            <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 bg-muted/30">
              <span className="text-muted-foreground text-sm select-none">$</span>
              <input
                type="text"
                value={jsonPath}
                onChange={(e) => setJsonPath(e.target.value)}
                placeholder={t("jsonPathPlaceholder")}
                className="h-7 w-28 rounded border border-border bg-background px-2 text-sm font-mono"
              />
              <div className="ml-auto flex items-center gap-1">
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary" onClick={handleExpandAll} disabled={!hasOutput}>
                  {t("expand")}
                </Button>
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/40 hover:text-primary" onClick={handleCollapseAll} disabled={!hasOutput}>
                  {t("collapse")}
                </Button>
              </div>
            </div>

            {/* Tabs content */}
            <Tabs defaultValue="tree" className="flex flex-col flex-1 min-h-0">
              <div className="px-2 pt-1">
                <TabsList>
                  <TabsTrigger value="tree">{t("treeView")}</TabsTrigger>
                  <TabsTrigger value="code">{t("codeView")}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="tree"
                className="flex-1 overflow-auto px-3 pb-3 mt-0"
              >
                {hasOutput ? (
                  <JsonTreeView
                    key={treeKey}
                    data={parsedData}
                    filter={jsonPath}
                    defaultExpandLevel={treeExpandLevel}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground py-20">
                    {t("outputPlaceholder")}
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="code"
                className="flex-1 overflow-auto px-3 pb-3 mt-0"
              >
                {output ? (
                  <SyntaxHighlight code={output} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground py-20">
                    {t("outputPlaceholder")}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
