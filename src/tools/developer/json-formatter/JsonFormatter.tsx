"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextArea } from "@/components/shared/TextArea";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { TextFileDownloadButton } from "@/components/shared/TextFileDownloadButton";
import { formatJson, minifyJson, validateJson, type JsonResult } from "./logic";
import { Check, X } from "lucide-react";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<JsonResult | null>(null);
  const [indent, setIndent] = useState(2);
  const t = useTranslations("tools.developer.json-formatter");

  function handleFormat() {
    const r = formatJson(input, indent);
    setResult(r);
    setOutput(r.output);
  }

  function handleMinify() {
    const r = minifyJson(input);
    setResult(r);
    setOutput(r.output);
  }

  function handleValidate() {
    const r = validateJson(input);
    setResult(r);
  }

  return (
    <div className="space-y-4">
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFileDrop={(text) => setInput(text)}
        acceptFileTypes={[".json", ".txt"]}
        placeholder={t("inputPlaceholder")}
        className="min-h-[200px] font-mono text-sm"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleFormat}>{t("format")}</Button>
        <Button variant="secondary" onClick={handleMinify}>
          {t("minify")}
        </Button>
        <Button variant="outline" onClick={handleValidate}>
          {t("validate")}
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-muted-foreground">
            {t("indentSpaces")}
          </label>
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="h-8 rounded border border-border bg-background px-2 text-sm"
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </div>
      </div>

      {result && (
        <div
          className={`flex items-center gap-2 text-sm ${
            result.valid ? "text-green-600" : "text-red-500"
          }`}
        >
          {result.valid ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {result.valid ? t("valid") : `${t("invalid")}: ${result.error}`}
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex justify-end gap-2">
            <TextFileDownloadButton text={output} filename="formatted.json" mimeType="application/json" />
            <CopyButton text={output} />
          </div>
          <pre className="rounded-lg border border-border bg-muted/30 p-4 text-sm overflow-auto max-h-96 font-mono">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
