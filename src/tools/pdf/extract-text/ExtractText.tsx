"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { extractText } from "./logic";

export default function ExtractText() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.pdf.extract-text");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setText("");
    setError("");
  }

  async function handleExtract() {
    if (!file) return;
    setProcessing(true);
    setText("");
    setError("");
    try {
      const result = await extractText(file);
      setText(result || t("noTextFound"));
    } catch (e) {
      console.error("Extraction failed:", e);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" onFiles={handleFile} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {file && (
        <>
          <p className="text-sm text-muted-foreground">{file.name}</p>

          <Button onClick={handleExtract} disabled={processing}>
            {processing ? t("extracting") : t("extract")}
          </Button>
        </>
      )}

      {text && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("extractedText")}</span>
            <CopyButton text={text} />
          </div>
          <textarea
            readOnly
            value={text}
            className="h-80 w-full rounded-lg border bg-muted/50 p-3 font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
}
