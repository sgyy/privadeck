"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "@/lib/theme/ThemeProvider";

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  language?: string;
  loadingText: string;
}

export function MonacoJsonEditor({
  value,
  onChange,
  readOnly = false,
  height = "450px",
  language = "json",
  loadingText,
}: MonacoEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Editor
      height={height}
      language={language}
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {loadingText}
        </div>
      }
      options={{
        readOnly,
        minimap: { enabled: false },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontSize: 13,
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
        tabSize: 2,
        wordWrap: "on",
        folding: true,
        bracketPairColorization: { enabled: true },
        renderLineHighlight: "line",
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        padding: { top: 8, bottom: 8 },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
      }}
    />
  );
}
