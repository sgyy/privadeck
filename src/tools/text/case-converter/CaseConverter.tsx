"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextArea } from "@/components/shared/TextArea";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/Button";
import { convertCase, type CaseType } from "./logic";

const CASES: CaseType[] = [
  "upper",
  "lower",
  "title",
  "sentence",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const t = useTranslations("tools.text.case-converter");

  function handleConvert(caseType: CaseType) {
    setOutput(convertCase(text, caseType));
  }

  return (
    <div className="space-y-4">
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
        className="min-h-[120px]"
      />

      <div className="flex flex-wrap gap-2">
        {CASES.map((c) => (
          <Button
            key={c}
            variant="outline"
            size="sm"
            onClick={() => handleConvert(c)}
          >
            {t(c)}
          </Button>
        ))}
      </div>

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Output</span>
            <CopyButton text={output} />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap break-all">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
