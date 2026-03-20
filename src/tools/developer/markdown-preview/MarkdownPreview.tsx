"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/shared/CopyButton";
import { TextDropZone } from "@/components/shared/TextDropZone";
import { markdownToHtml } from "./logic";

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState("");
  const t = useTranslations("tools.developer.markdown-preview");

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("markdownLabel")}</label>
          <TextDropZone onTextLoaded={(text) => setMarkdown(text)} accept={[".md", ".markdown", ".txt"]} isEmpty={!markdown}>
            {({ dropClassName }) => (
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder={t("markdownPlaceholder")}
                className={`w-full min-h-[350px] rounded-lg border border-border bg-background p-3 font-mono text-sm resize-y ${dropClassName}`}
              />
            )}
          </TextDropZone>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("previewLabel")}</label>
            {html && <CopyButton text={html} />}
          </div>
          <div
            className="w-full min-h-[350px] rounded-lg border border-border bg-background p-3 text-sm overflow-auto prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
