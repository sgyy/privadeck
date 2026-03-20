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

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        {children}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>{tc("privacy")}</span>
      </div>
    </div>
  );
}
