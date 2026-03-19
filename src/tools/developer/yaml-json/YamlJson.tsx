"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { yamlToJson, jsonToYaml } from "./logic";

export default function YamlJson() {
  const [yamlText, setYamlText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations("tools.developer.yaml-json");

  function handleYamlToJson() {
    setError("");
    try {
      const result = yamlToJson(yamlText);
      setJsonText(result);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleJsonToYaml() {
    setError("");
    try {
      const result = jsonToYaml(jsonText);
      setYamlText(result);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("yamlLabel")}</label>
            {yamlText && <CopyButton text={yamlText} />}
          </div>
          <textarea
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            placeholder={t("yamlPlaceholder")}
            className="w-full min-h-[250px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("jsonLabel")}</label>
            {jsonText && <CopyButton text={jsonText} />}
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
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
        <Button onClick={handleYamlToJson} disabled={!yamlText.trim()}>
          {t("yamlToJson")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleJsonToYaml}
          disabled={!jsonText.trim()}
        >
          {t("jsonToYaml")}
        </Button>
      </div>
    </div>
  );
}
