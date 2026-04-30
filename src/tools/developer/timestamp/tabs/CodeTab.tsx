"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/shared/CopyButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { generateCodeSnippets } from "../logic";

const LANGS: { value: string; labelKey: string; getter: (s: ReturnType<typeof generateCodeSnippets>) => string }[] = [
  { value: "python", labelKey: "codeLangPython", getter: (s) => s.python },
  { value: "javascript", labelKey: "codeLangJavascript", getter: (s) => s.javascript },
  { value: "go", labelKey: "codeLangGo", getter: (s) => s.go },
  { value: "bash", labelKey: "codeLangBash", getter: (s) => s.bash },
  { value: "sql", labelKey: "codeLangSql", getter: (s) => s.sql },
];

export function CodeTab({ mainMs }: { mainMs: number | null }) {
  const t = useTranslations("tools.developer.timestamp");
  const [active, setActive] = useState("python");

  const snippets = useMemo(() => {
    if (mainMs == null) return null;
    const seconds = Math.floor(mainMs / 1000);
    return generateCodeSnippets(seconds);
  }, [mainMs]);

  if (mainMs == null || !snippets) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {t("codeEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {t("codeHint", { ts: Math.floor(mainMs / 1000) })}
      </div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList aria-label={t("tabCode")}>
          {LANGS.map((l) => (
            <TabsTrigger key={l.value} value={l.value}>
              {t(l.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        {LANGS.map((l) => {
          const code = l.getter(snippets);
          return (
            <TabsContent key={l.value} value={l.value}>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                  <code>{code}</code>
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton text={code} />
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
