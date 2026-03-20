"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { TextFileDownloadButton } from "@/components/shared/TextFileDownloadButton";
import { TextDropZone } from "@/components/shared/TextDropZone";
import { csvToJson, jsonToCsv } from "./logic";

export default function CsvJsonTool() {
  const [csv, setCsv] = useState("");
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations("tools.developer.csv-json");

  function handleCsvToJson() {
    setError("");
    try {
      const result = csvToJson(csv);
      setJson(result);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleJsonToCsv() {
    setError("");
    try {
      const result = jsonToCsv(json);
      setCsv(result);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("csvLabel")}</label>
            <div className="flex gap-2">
              {csv && <TextFileDownloadButton text={csv} filename="data.csv" mimeType="text/csv" />}
              {csv && <CopyButton text={csv} />}
            </div>
          </div>
          <TextDropZone onTextLoaded={(text) => setCsv(text)} accept={[".csv", ".tsv", ".txt"]} isEmpty={!csv}>
            {({ dropClassName }) => (
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder={t("csvPlaceholder")}
                className={`w-full min-h-[250px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y ${dropClassName}`}
              />
            )}
          </TextDropZone>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("jsonLabel")}</label>
            <div className="flex gap-2">
              {json && <TextFileDownloadButton text={json} filename="data.json" mimeType="application/json" />}
              {json && <CopyButton text={json} />}
            </div>
          </div>
          <TextDropZone onTextLoaded={(text) => setJson(text)} accept={[".json", ".txt"]} isEmpty={!json}>
            {({ dropClassName }) => (
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder={t("jsonPlaceholder")}
                className={`w-full min-h-[250px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y ${dropClassName}`}
              />
            )}
          </TextDropZone>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleCsvToJson} disabled={!csv.trim()}>
          {t("csvToJson")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleJsonToCsv}
          disabled={!json.trim()}
        >
          {t("jsonToCsv")}
        </Button>
      </div>
    </div>
  );
}
