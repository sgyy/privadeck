"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextArea } from "@/components/shared/TextArea";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { encodeBase64, decodeBase64 } from "./logic";

export default function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const t = useTranslations("tools.developer.base64");

  return (
    <div className="space-y-4">
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("inputPlaceholder")}
        className="min-h-[150px] font-mono text-sm"
      />

      <div className="flex gap-3">
        <Button onClick={() => setOutput(encodeBase64(input))}>
          {t("encode")}
        </Button>
        <Button variant="secondary" onClick={() => setOutput(decodeBase64(input))}>
          {t("decode")}
        </Button>
      </div>

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("output")}</span>
            <CopyButton text={output} />
          </div>
          <pre className="rounded-lg border border-border bg-muted/30 p-4 text-sm overflow-auto max-h-96 font-mono break-all whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
