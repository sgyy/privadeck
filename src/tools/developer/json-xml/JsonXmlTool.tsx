"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/shared/CopyButton";
import { TextFileDownloadButton } from "@/components/shared/TextFileDownloadButton";
import { TextDropZone } from "@/components/shared/TextDropZone";
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("xmlLabel")}</label>
            <div className="flex gap-2">
              {xml && <TextFileDownloadButton text={xml} filename="data.xml" mimeType="application/xml" />}
              {xml && <CopyButton text={xml} />}
            </div>
          </div>
          <TextDropZone onTextLoaded={(text) => setXml(text)} accept={[".xml", ".txt"]} isEmpty={!xml}>
            {({ dropClassName }) => (
              <textarea
                value={xml}
                onChange={(e) => setXml(e.target.value)}
                placeholder={t("xmlPlaceholder")}
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
