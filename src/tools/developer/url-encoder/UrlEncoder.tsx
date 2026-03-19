"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextArea } from "@/components/shared/TextArea";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import {
  encodeUrl,
  decodeUrl,
  encodeUrlComponent,
  decodeUrlComponent,
} from "./logic";

export default function UrlEncoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const t = useTranslations("tools.developer.url-encoder");

  return (
    <div className="space-y-4">
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("inputPlaceholder")}
        className="min-h-[120px] font-mono text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOutput(encodeUrl(input))}>{t("encode")}</Button>
        <Button variant="secondary" onClick={() => setOutput(decodeUrl(input))}>
          {t("decode")}
        </Button>
        <Button variant="outline" onClick={() => setOutput(encodeUrlComponent(input))}>
          {t("encodeComponent")}
        </Button>
        <Button variant="outline" onClick={() => setOutput(decodeUrlComponent(input))}>
          {t("decodeComponent")}
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
