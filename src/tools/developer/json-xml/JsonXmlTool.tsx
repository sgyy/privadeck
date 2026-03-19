"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { jsonToXml, xmlToJson } from "./logic";

export default function JsonXmlTool() {
  const [json, setJson] = useState("");
  const [xml, setXml] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations("tools.developer.json-xml");

  function handleJsonToXml() {
    setError("");
    try {
      const result = jsonToXml(json);
      setXml(result);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  function handleXmlToJson() {
    setError("");
    try {
      const result = xmlToJson(xml);
      setJson(result);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("xmlLabel")}</label>
            {xml && <CopyButton text={xml} />}
          </div>
          <textarea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            placeholder={t("xmlPlaceholder")}
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
        <Button onClick={handleJsonToXml} disabled={!json.trim()}>
          {t("jsonToXml")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleXmlToJson}
          disabled={!xml.trim()}
        >
          {t("xmlToJson")}
        </Button>
      </div>
    </div>
  );
}
