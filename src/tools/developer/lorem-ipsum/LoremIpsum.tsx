"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { Select } from "@/components/ui/Select";
import { generateLoremIpsum, type GenerateMode } from "./logic";

export default function LoremIpsum() {
  const [mode, setMode] = useState<GenerateMode>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");
  const t = useTranslations("tools.developer.lorem-ipsum");

  function handleGenerate() {
    setOutput(generateLoremIpsum(mode, count, startWithLorem));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("generateBy")}
          </label>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value as GenerateMode)}
          >
            <option value="paragraphs">{t("paragraphs")}</option>
            <option value="sentences">{t("sentences")}</option>
            <option value="words">{t("wordsOption")}</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("count")}
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-10 w-24 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <Button onClick={handleGenerate}>{t("generate")}</Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={startWithLorem}
          onChange={(e) => setStartWithLorem(e.target.checked)}
          className="rounded"
        />
        {t("startWithLorem")}
      </label>

      {output && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <CopyButton text={output} />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
