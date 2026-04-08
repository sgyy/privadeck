"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpDown, Eraser } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/shared/TextArea";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { CopyButton } from "@/components/shared/CopyButton";
import { TextFileDownloadButton } from "@/components/shared/TextFileDownloadButton";
import { DownloadButton } from "@/components/shared/DownloadButton";
import {
  encodeBase64,
  decodeBase64,
  encodeFileToBase64,
  decodeBase64ToBytes,
  isLikelyBase64,
  detectImageMime,
  formatDataUri,
  normalizeToStandard,
  formatByteSize,
  guessMimeFromName,
  type Base64Variant,
} from "./logic";

type Direction = "encode" | "decode";
type InputMode = "text" | "file";

export default function Base64Tool() {
  const t = useTranslations("tools.developer.base64");

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [direction, setDirection] = useState<Direction>("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [dataUri, setDataUri] = useState(false);

  // Text mode
  const [textInput, setTextInput] = useState("");

  // File mode
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64Output, setFileBase64Output] = useState("");
  const [fileBase64Input, setFileBase64Input] = useState("");

  // Auto-detect
  const [autoDetectMsg, setAutoDetectMsg] = useState("");
  const userOverrodeDirection = useRef(false);

  // File ref for event-driven processing
  const fileRef = useRef<File | null>(null);

  // --- Text mode: synchronous computation ---
  const textResult = useMemo(() => {
    if (inputMode !== "text" || !textInput) return { output: "", error: "", imageMime: null as string | null };
    if (direction === "encode") {
      const r = encodeBase64(textInput, variant);
      return r.ok ? { output: r.output, error: "", imageMime: null as string | null } : { output: "", error: t("errorEncodeFailed"), imageMime: null as string | null };
    }
    const r = decodeBase64(textInput, variant);
    if (!r.ok) return { output: "", error: t("errorInvalidBase64"), imageMime: null as string | null };
    // Detect image in decoded bytes for preview (avoids a separate decodeBase64ToBytes call)
    const bytes = decodeBase64ToBytes(textInput, variant);
    const imageMime = bytes.ok ? detectImageMime(bytes.output) : null;
    return { output: r.output, error: "", imageMime };
  }, [inputMode, textInput, direction, variant, t]);

  // --- File mode decode: synchronous computation ---
  const fileDecodeResult = useMemo(() => {
    if (inputMode !== "file" || direction !== "decode" || !fileBase64Input) {
      return { blob: null, imageMime: null as string | null, sizeText: "", error: "" };
    }
    const result = decodeBase64ToBytes(fileBase64Input, variant);
    if (!result.ok) return { blob: null, imageMime: null as string | null, sizeText: "", error: t("errorInvalidBase64") };
    const imageMime = detectImageMime(result.output);
    const blobMime = imageMime ?? "application/octet-stream";
    const blob = new Blob([result.output as BlobPart], { type: blobMime });
    return { blob, imageMime, sizeText: formatByteSize(result.output.length), error: "" };
  }, [inputMode, direction, fileBase64Input, variant, t]);

  // --- File mode encode: event-driven (no useEffect) ---
  const processFileEncode = useCallback(async (f: File | null, v: Base64Variant, useDataUri: boolean) => {
    if (!f) { setFileBase64Output(""); return; }
    try {
      const buf = await f.arrayBuffer();
      let b64 = encodeFileToBase64(buf, v);
      if (useDataUri) b64 = formatDataUri(b64, guessMimeFromName(f.name));
      setFileBase64Output(b64);
    } catch {
      setFileBase64Output("");
    }
  }, []);

  // --- Image preview: reuse imageMime from upstream memos (no redundant decode) ---
  const imagePreviewDataUrl = useMemo(() => {
    // Text mode decode
    if (inputMode === "text" && direction === "decode" && textInput && textResult.imageMime) {
      const stdBase64 = normalizeToStandard(textInput, variant);
      return `data:${textResult.imageMime};base64,${stdBase64}`;
    }
    // File mode decode
    if (inputMode === "file" && direction === "decode" && fileBase64Input && fileDecodeResult.imageMime) {
      const stdBase64 = normalizeToStandard(fileBase64Input, variant);
      return `data:${fileDecodeResult.imageMime};base64,${stdBase64}`;
    }
    return null;
  }, [inputMode, direction, textInput, textResult.imageMime, variant, fileBase64Input, fileDecodeResult.imageMime]);

  // --- Auto-detect in input handler ---
  const handleTextInputChange = useCallback(
    (value: string) => {
      setTextInput(value);
      if (
        !userOverrodeDirection.current &&
        direction === "encode" &&
        value.length >= 8 &&
        isLikelyBase64(value)
      ) {
        setDirection("decode");
        setAutoDetectMsg(t("detectedAsBase64"));
        setTimeout(() => setAutoDetectMsg(""), 3000);
      }
    },
    [direction, t],
  );

  // --- Event handlers ---
  const handleClear = useCallback(() => {
    setTextInput("");
    setFile(null);
    fileRef.current = null;
    setFileBase64Input("");
    setFileBase64Output("");
    setAutoDetectMsg("");
    userOverrodeDirection.current = false;
  }, []);

  const handleSwap = useCallback(() => {
    if (inputMode === "text" && textResult.output) {
      setTextInput(textResult.output);
      userOverrodeDirection.current = true;
      setDirection((d) => (d === "encode" ? "decode" : "encode"));
    }
  }, [inputMode, textResult.output]);

  const handleDirectionChange = useCallback((val: string) => {
    const d = val as Direction;
    setDirection(d);
    userOverrodeDirection.current = true;
    setAutoDetectMsg("");
    if (inputMode === "file" && d === "encode" && fileRef.current) {
      processFileEncode(fileRef.current, variant, dataUri);
    }
  }, [inputMode, variant, dataUri, processFileEncode]);

  const handleVariantChange = useCallback((v: Base64Variant) => {
    setVariant(v);
    if (inputMode === "file" && direction === "encode" && fileRef.current) {
      processFileEncode(fileRef.current, v, dataUri);
    }
  }, [inputMode, direction, dataUri, processFileEncode]);

  const handleDataUriChange = useCallback((checked: boolean) => {
    setDataUri(checked);
    if (inputMode === "file" && direction === "encode" && fileRef.current) {
      processFileEncode(fileRef.current, variant, checked);
    }
  }, [inputMode, direction, variant, processFileEncode]);

  const handleFileSelected = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    fileRef.current = f;
    processFileEncode(f, variant, dataUri);
  }, [variant, dataUri, processFileEncode]);

  // --- Derived values ---
  const currentError =
    inputMode === "text"
      ? textResult.error
      : direction === "decode"
        ? fileDecodeResult.error
        : "";

  const decodedBlob = inputMode === "file" && direction === "decode" ? fileDecodeResult.blob : null;

  const copyableOutput =
    inputMode === "text"
      ? textResult.output
      : direction === "encode"
        ? fileBase64Output
        : "";

  const hasOutput = !!(copyableOutput || decodedBlob);

  const inputSizeText = useMemo(() => {
    if (inputMode === "text") return textInput ? `${textInput.length} chars` : "";
    if (direction === "encode" && file) return formatByteSize(file.size);
    if (direction === "decode" && fileBase64Input) return `${fileBase64Input.length} chars`;
    return "";
  }, [inputMode, textInput, file, fileBase64Input, direction]);

  const outputSizeText = useMemo(() => {
    if (inputMode === "text" && textResult.output) return `${textResult.output.length} chars`;
    if (inputMode === "file" && direction === "encode" && fileBase64Output) return `${fileBase64Output.length} chars`;
    if (decodedBlob) return formatByteSize(decodedBlob.size);
    return "";
  }, [inputMode, textResult.output, fileBase64Output, decodedBlob, direction]);

  return (
    <div className="space-y-4">
      <Tabs value={inputMode} onValueChange={(v) => { setInputMode(v as InputMode); handleClear(); }}>
        <TabsList>
          <TabsTrigger value="text">{t("textMode")}</TabsTrigger>
          <TabsTrigger value="file">{t("fileMode")}</TabsTrigger>
        </TabsList>

        {/* Options bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t("direction")}:</span>
            <div className="flex gap-1">
              <Button
                variant={direction === "encode" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleDirectionChange("encode")}
              >
                {t("directionEncode")}
              </Button>
              <Button
                variant={direction === "decode" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleDirectionChange("decode")}
              >
                {t("directionDecode")}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t("variant")}:</span>
            <div className="flex gap-1">
              <Button
                variant={variant === "standard" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleVariantChange("standard")}
              >
                {t("variantStandard")}
              </Button>
              <Button
                variant={variant === "url-safe" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleVariantChange("url-safe")}
              >
                {t("variantUrlSafe")}
              </Button>
            </div>
          </div>

          {inputMode === "file" && direction === "encode" && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={dataUri}
                onChange={(e) => handleDataUriChange(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span>{t("dataUri")}</span>
            </label>
          )}
        </div>

        {/* Text mode */}
        <TabsContent value="text" className="mt-3">
          <TextArea
            value={textInput}
            onChange={(e) => handleTextInputChange(e.target.value)}
            onFileDrop={(text) => handleTextInputChange(text)}
            placeholder={t("inputPlaceholder")}
            className="min-h-[150px] font-mono text-sm"
          />
        </TabsContent>

        {/* File mode */}
        <TabsContent value="file" className="mt-3">
          {direction === "encode" ? (
            <div className="space-y-2">
              <FileDropzone onFiles={handleFileSelected} />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{t("fileName")}:</span>
                  <span className="truncate">{file.name}</span>
                  <span>({formatByteSize(file.size)})</span>
                </div>
              )}
            </div>
          ) : (
            <TextArea
              value={fileBase64Input}
              onChange={(e) => setFileBase64Input(e.target.value)}
              onFileDrop={(text) => setFileBase64Input(text)}
              placeholder={t("pasteBase64ToDecodeFile")}
              className="min-h-[150px] font-mono text-sm"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Eraser className="h-3.5 w-3.5" />
            {t("clear")}
          </Button>
          {inputMode === "text" && textResult.output && (
            <Button variant="ghost" size="sm" onClick={handleSwap} title={t("swapHint")}>
              <ArrowUpDown className="h-3.5 w-3.5" />
              {t("swap")}
            </Button>
          )}
        </div>
        {inputSizeText && (
          <span className="text-xs text-muted-foreground">
            {t("inputSize")}: {inputSizeText}
          </span>
        )}
      </div>

      {autoDetectMsg && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs text-primary">
          {autoDetectMsg}
        </div>
      )}

      {currentError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {currentError}
        </div>
      )}

      {hasOutput && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("output")}</span>
              {outputSizeText && (
                <span className="text-xs text-muted-foreground">{outputSizeText}</span>
              )}
            </div>
            <div className="flex gap-2">
              {decodedBlob && (
                <DownloadButton data={decodedBlob} filename="base64-decoded" />
              )}
              {copyableOutput && (
                <>
                  <TextFileDownloadButton text={copyableOutput} filename="base64-output.txt" />
                  <CopyButton text={copyableOutput} />
                </>
              )}
            </div>
          </div>

          {copyableOutput && (
            <pre className="rounded-lg border border-border bg-muted/30 p-4 text-sm overflow-auto max-h-96 font-mono break-all whitespace-pre-wrap">
              {copyableOutput}
            </pre>
          )}

          {imagePreviewDataUrl && (
            <div className="space-y-2">
              <span className="text-sm font-medium">{t("imagePreview")}</span>
              <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewDataUrl}
                  alt="Decoded preview"
                  className="max-h-64 max-w-full object-contain rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
