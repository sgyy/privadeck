"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX, Copy, Check, KeyRound } from "lucide-react";
import { TextArea } from "@/components/shared/TextArea";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { CopyButton } from "@/components/shared/CopyButton";
import { TextFileDownloadButton } from "@/components/shared/TextFileDownloadButton";
import { ProcessingProgress } from "@/components/shared/ProcessingProgress";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  computeAllHashes,
  computeAllHMAC,
  formatHash,
  verifyHash,
  parseHexKey,
  type OutputFormat,
} from "./logic";

type InputMode = "text" | "file";
type ComputeMode = "hash" | "hmac";

export default function HashGenerator() {
  const t = useTranslations("tools.developer.hash-generator");

  // Input state
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Compute mode
  const [computeMode, setComputeMode] = useState<ComputeMode>("hash");
  const [hmacKey, setHmacKey] = useState("");
  const [hmacKeyFormat, setHmacKeyFormat] = useState<"text" | "hex">("text");

  // Output state
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("hex-lower");
  const [rawResults, setRawResults] = useState<Record<string, ArrayBuffer> | null>(null);
  const [fileResults, setFileResults] = useState<
    { name: string; results: Record<string, ArrayBuffer> }[]
  >([]);
  const [processing, setProcessing] = useState(false);
  const [fileProgress, setFileProgress] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");

  // Verification
  const [expectedHash, setExpectedHash] = useState("");

  // Debounce ref for real-time text hashing
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Copy-all state
  const [copiedAll, setCopiedAll] = useState(false);

  // ---------------------------------------------------------------------------
  // Real-time text hashing
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (inputMode !== "text" || !text.trim()) {
      setRawResults(null);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setError("");
        const data = new TextEncoder().encode(text).buffer as ArrayBuffer;
        const keyBytes = getKeyBytes();
        const hashes =
          computeMode === "hmac" && keyBytes
            ? await computeAllHMAC(data, keyBytes)
            : await computeAllHashes(data);
        setRawResults(hashes);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    }, 150);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, inputMode, computeMode, hmacKey, hmacKeyFormat]);

  // ---------------------------------------------------------------------------
  // File hashing
  // ---------------------------------------------------------------------------
  async function handleFileCompute() {
    if (files.length === 0) return;
    setProcessing(true);
    setFileResults([]);
    setRawResults(null);
    setError("");

    try {
      const results: { name: string; results: Record<string, ArrayBuffer> }[] = [];
      const keyBytes = getKeyBytes();

      for (let i = 0; i < files.length; i++) {
        setFileProgress(undefined);
        const file = files[i];

        // Read file with progress
        const data = await readFileWithProgress(file, (p) => {
          const base = (i / files.length) * 100;
          const slice = (1 / files.length) * 100;
          setFileProgress(base + (p / 100) * slice);
        });

        const hashes =
          computeMode === "hmac" && keyBytes
            ? await computeAllHMAC(data, keyBytes)
            : await computeAllHashes(data);

        results.push({ name: file.name, results: hashes });
      }

      if (results.length === 1) {
        setRawResults(results[0].results);
      } else {
        setFileResults(results);
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setProcessing(false);
      setFileProgress(undefined);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getKeyBytes(): ArrayBuffer | null {
    if (computeMode !== "hmac" || !hmacKey.trim()) return null;
    try {
      if (hmacKeyFormat === "hex") return parseHexKey(hmacKey);
      return new TextEncoder().encode(hmacKey).buffer as ArrayBuffer;
    } catch {
      return null;
    }
  }

  // Format results for display
  const formattedResults = useMemo(() => {
    if (!rawResults) return null;
    const formatted: Record<string, string> = {};
    for (const [algo, buf] of Object.entries(rawResults)) {
      formatted[algo] = formatHash(buf, outputFormat);
    }
    return formatted;
  }, [rawResults, outputFormat]);

  const formattedFileResults = useMemo(() => {
    return fileResults.map((fr) => {
      const formatted: Record<string, string> = {};
      for (const [algo, buf] of Object.entries(fr.results)) {
        formatted[algo] = formatHash(buf, outputFormat);
      }
      return { name: fr.name, results: formatted };
    });
  }, [fileResults, outputFormat]);

  // Verification
  const verification = useMemo(() => {
    if (!expectedHash.trim() || !formattedResults) return null;
    return verifyHash(expectedHash, formattedResults);
  }, [expectedHash, formattedResults]);

  // Build "copy all" / "download" text
  const allHashesText = useMemo(() => {
    if (formattedResults) {
      return Object.entries(formattedResults)
        .map(([algo, hash]) => `${algo}: ${hash}`)
        .join("\n");
    }
    if (formattedFileResults.length > 0) {
      return formattedFileResults
        .map(
          (fr) =>
            `# ${fr.name}\n` +
            Object.entries(fr.results)
              .map(([algo, hash]) => `${algo}: ${hash}`)
              .join("\n")
        )
        .join("\n\n");
    }
    return "";
  }, [formattedResults, formattedFileResults]);

  const handleCopyAll = useCallback(async () => {
    if (!allHashesText) return;
    try {
      await navigator.clipboard.writeText(allHashesText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  }, [allHashesText]);

  const hasResults = formattedResults || formattedFileResults.length > 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Compute mode: Hash vs HMAC */}
      <Tabs
        value={computeMode}
        onValueChange={(v) => {
          setComputeMode(v as ComputeMode);
          setRawResults(null);
          setFileResults([]);
        }}
      >
        <TabsList>
          <TabsTrigger value="hash">{t("hashMode")}</TabsTrigger>
          <TabsTrigger value="hmac">
            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
            {t("hmacMode")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* HMAC key input */}
      {computeMode === "hmac" && (
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium">{t("secretKey")}</label>
            <p className="text-xs text-muted-foreground mt-0.5">{t("secretKeyDescription")}</p>
          </div>
          <input
            type="text"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            placeholder={t("secretKeyPlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("keyFormat")}:</span>
            <div className="flex gap-1">
              <Button
                variant={hmacKeyFormat === "text" ? "primary" : "outline"}
                size="sm"
                onClick={() => setHmacKeyFormat("text")}
              >
                {t("keyFormatText")}
              </Button>
              <Button
                variant={hmacKeyFormat === "hex" ? "primary" : "outline"}
                size="sm"
                onClick={() => setHmacKeyFormat("hex")}
              >
                {t("keyFormatHex")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input mode: Text vs File */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === "text" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setInputMode("text");
            setRawResults(null);
            setFileResults([]);
          }}
        >
          {t("textMode")}
        </Button>
        <Button
          variant={inputMode === "file" ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            setInputMode("file");
            setRawResults(null);
            setFileResults([]);
          }}
        >
          {t("fileMode")}
        </Button>
      </div>

      {/* Text input */}
      {inputMode === "text" ? (
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFileDrop={(content) => setText(content)}
          placeholder={t("inputPlaceholder")}
          showCount
          className="min-h-[150px] font-mono text-sm"
        />
      ) : (
        <div className="space-y-2">
          <FileDropzone
            multiple
            onFiles={(f) => {
              setFiles(Array.from(f));
              setRawResults(null);
              setFileResults([]);
            }}
          />
          {files.length > 0 && (
            <div className="space-y-1" role="list" aria-label={t("selectedFiles")}>
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  role="listitem"
                  className="rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  {f.name}{" "}
                  <span className="text-muted-foreground">
                    ({formatFileSize(f.size)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File compute button + progress */}
      {inputMode === "file" && (
        <>
          <Button
            onClick={handleFileCompute}
            disabled={files.length === 0 || processing}
          >
            {processing ? t("computing") : t("compute")}
          </Button>
          {processing && (
            <ProcessingProgress
              progress={fileProgress}
              label={
                fileProgress !== undefined ? t("readingFile") : t("computing")
              }
            />
          )}
        </>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Output format selector + actions */}
      {hasResults && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Output format */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("outputFormatLabel")}:</span>
            <div className="flex gap-1 rounded-lg bg-muted/70 p-1">
              {(
                [
                  ["hex-lower", "hex"],
                  ["hex-upper", "HEX"],
                  ["base64", "Base64"],
                ] as const
              ).map(([fmt, label]) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setOutputFormat(fmt)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    outputFormat === fmt
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Copy all */}
          <Button variant="outline" size="sm" onClick={handleCopyAll}>
            {copiedAll ? (
              <>
                <Check className="h-4 w-4" />
                {t("copiedAll")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t("copyAll")}
              </>
            )}
          </Button>

          {/* Download */}
          <TextFileDownloadButton
            text={allHashesText}
            filename="hashes.txt"
            analyticsSlug="hash-generator"
            analyticsCategory="developer"
          />
        </div>
      )}

      {/* Single-input results */}
      {formattedResults && (
        <div className="space-y-3" aria-label={t("hashResults")} role="region">
          {(Object.entries(formattedResults) as [string, string][]).map(
            ([algo, hash]) => {
              const isPrimary = ["SHA-256", "SHA-512", "MD5"].includes(algo);
              return (
                <div
                  key={algo}
                  className={`rounded-lg border p-3 ${
                    isPrimary
                      ? "border-border bg-muted/30"
                      : "border-border/50 bg-muted/15"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isPrimary ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {algo}
                    </span>
                    <CopyButton text={hash} />
                  </div>
                  <p
                    className={`font-mono text-xs break-all ${
                      isPrimary
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {hash}
                  </p>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Batch file results */}
      {formattedFileResults.length > 0 && (
        <div className="space-y-4">
          {formattedFileResults.map((fr, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-sm font-semibold">{fr.name}</h3>
              <div className="space-y-2">
                {Object.entries(fr.results).map(([algo, hash]) => (
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
            </div>
          ))}
        </div>
      )}

      {/* Hash verification (single-result mode only) */}
      {formattedResults && (
        <fieldset className="space-y-2 rounded-lg border border-border/50 p-4">
          <legend className="text-sm font-medium px-1">{t("verifyHash")}</legend>
          <input
            type="text"
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            placeholder={t("expectedHashPlaceholder")}
            aria-describedby="verification-result"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <div id="verification-result" role="status" aria-live="polite" className="flex items-center gap-2">
            {expectedHash.trim() && verification && (
              verification.match ? (
                <Badge
                  className="bg-green-500/10 text-green-600 border border-green-200 dark:border-green-800 dark:text-green-400"
                >
                  <CircleCheck className="mr-1 h-3.5 w-3.5" />
                  {t("verifyMatchAlgo", { algorithm: verification.algorithm ?? "" })}
                </Badge>
              ) : (
                <Badge
                  className="bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800 dark:text-red-400"
                >
                  <CircleX className="mr-1 h-3.5 w-3.5" />
                  {t("verifyNoMatch")}
                </Badge>
              )
            )}
          </div>
        </fieldset>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function readFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
