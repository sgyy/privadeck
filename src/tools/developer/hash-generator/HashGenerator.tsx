"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { computeAllHashes, type HashAlgorithm } from "./logic";

type InputMode = "text" | "file";

export default function HashGenerator() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Record<HashAlgorithm, string> | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.developer.hash-generator");

  async function handleCompute() {
    setProcessing(true);
    setResults(null);
    setError("");
    try {
      let data: ArrayBuffer;
      if (mode === "text") {
        data = new TextEncoder().encode(text).buffer;
      } else if (file) {
        data = await file.arrayBuffer();
      } else {
        return;
      }
      const hashes = await computeAllHashes(data);
      setResults(hashes);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  const canCompute = mode === "text" ? text.trim().length > 0 : file !== null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={mode === "text" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setMode("text");
            setResults(null);
          }}
        >
          {t("textMode")}
        </Button>
        <Button
          variant={mode === "file" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setMode("file");
            setResults(null);
          }}
        >
          {t("fileMode")}
        </Button>
      </div>

      {mode === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("inputPlaceholder")}
          className="w-full min-h-[150px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
        />
      ) : (
        <div className="space-y-2">
          <FileDropzone
            onFiles={(f) => {
              setFile(f[0]);
              setResults(null);
            }}
          />
          {file && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              {file.name}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <Button onClick={handleCompute} disabled={!canCompute || processing}>
        {processing ? t("computing") : t("compute")}
      </Button>

      {results && (
        <div className="space-y-3">
          {(
            Object.entries(results) as [HashAlgorithm, string][]
          ).map(([algo, hash]) => (
            <div
              key={algo}
              className="rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{algo}</span>
                <CopyButton text={hash} />
              </div>
              <p className="font-mono text-xs break-all text-muted-foreground">
                {hash}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
