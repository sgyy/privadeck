"use client";

import { useTranslations } from "next-intl";
import type { ToolDefinition } from "@/lib/registry/types";
import { Shield } from "lucide-react";
import { ToolHowItWorks } from "./ToolHowItWorks";

interface ToolPageShellProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const t = useTranslations(`tools.${tool.category}.${tool.slug}`);
  const tc = useTranslations("common");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("name")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <ToolHowItWorks category={tool.category} />

      {/* Local-Only privacy indicator */}
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/80 backdrop-blur-sm px-4 py-2.5 dark:border-emerald-800/70 dark:bg-emerald-950/80">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {tc("localOnlyIndicator")}
        </span>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
