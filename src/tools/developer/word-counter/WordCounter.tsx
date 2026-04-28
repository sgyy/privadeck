"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TextArea } from "@/components/shared/TextArea";
import { CopyButton } from "@/components/shared/CopyButton";
import { countWords } from "./logic";

export default function WordCounter() {
  const [text, setText] = useState("");
  const t = useTranslations("tools.developer.word-counter");
  const result = countWords(text);

  const summary = [
    `${t("words")}: ${result.words}`,
    `${t("characters")}: ${result.characters}`,
    `${t("sentences")}: ${result.sentences}`,
    `${t("paragraphs")}: ${result.paragraphs}`,
    `${t("readingTime")}: ${result.readingTimeMinutes} ${t("minutes")}`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFileDrop={(content) => setText(content)}
        placeholder={t("placeholder")}
        className="min-h-[200px]"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("words")} value={result.words} />
        <StatCard label={t("characters")} value={result.characters} />
        <StatCard label={t("sentences")} value={result.sentences} />
        <StatCard label={t("paragraphs")} value={result.paragraphs} />
        <StatCard
          label={t("readingTime")}
          value={`${result.readingTimeMinutes} ${t("minutes")}`}
        />
      </div>

      {text.trim() && (
        <div className="flex justify-end">
          <CopyButton text={summary} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
