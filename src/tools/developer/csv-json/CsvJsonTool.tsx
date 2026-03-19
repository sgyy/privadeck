"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
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
            {csv && <CopyButton text={csv} />}
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={t("csvPlaceholder")}
            className="w-full min-h-[250px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("jsonLabel")}</label>
            {json && <CopyButton text={json} />}
          </div>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder={t("jsonPlaceholder")}
            className="w-full min-h-[250px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
          />
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
