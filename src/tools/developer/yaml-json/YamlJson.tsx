"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { TextFileDownloadButton } from "@/components/shared/TextFileDownloadButton";
import { TextDropZone } from "@/components/shared/TextDropZone";
import { createToolTracker } from "@/lib/analytics";
import { yamlToJson, jsonToYaml } from "./logic";

const tracker = createToolTracker("yaml-json", "developer");

export default function YamlJson() {
  const [yamlText, setYamlText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations("tools.developer.yaml-json");

  function handleYamlToJson() {
    setError("");
    const t0 = performance.now();
    try {
      const result = yamlToJson(yamlText);
      setJsonText(result);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    }
  }

  function handleJsonToYaml() {
    setError("");
    const t0 = performance.now();
    try {
      const result = jsonToYaml(jsonText);
      setYamlText(result);
      tracker.trackProcessComplete(Math.round(performance.now() - t0));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tracker.trackProcessError(msg);
      setError(msg);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("yamlLabel")}</label>
            <div className="flex gap-2">
              {yamlText && <TextFileDownloadButton text={yamlText} filename="data.yaml" mimeType="text/yaml" />}
              {yamlText && <CopyButton text={yamlText} />}
            </div>
          </div>
          <TextDropZone onTextLoaded={(text) => setYamlText(text)} accept={[".yaml", ".yml", ".txt"]} isEmpty={!yamlText}>
            {({ dropClassName }) => (
              <textarea
                value={yamlText}
                onChange={(e) => setYamlText(e.target.value)}
                placeholder={t("yamlPlaceholder")}
                className={`w-full min-h-[250px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y ${dropClassName}`}
              />
            )}
          </TextDropZone>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("jsonLabel")}</label>
            <div className="flex gap-2">
              {jsonText && <TextFileDownloadButton text={jsonText} filename="data.json" mimeType="application/json" />}
              {jsonText && <CopyButton text={jsonText} />}
            </div>
          </div>
          <TextDropZone onTextLoaded={(text) => setJsonText(text)} accept={[".json", ".txt"]} isEmpty={!jsonText}>
            {({ dropClassName }) => (
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
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
