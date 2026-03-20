"use client";

import { useTranslations } from "next-intl";
import { Upload, Settings, Download } from "lucide-react";
import type { ToolCategory } from "@/lib/registry/types";

const textCategories: ToolCategory[] = ["developer"];

interface ToolHowItWorksProps {
  category: ToolCategory;
}

export function ToolHowItWorks({ category }: ToolHowItWorksProps) {
  const t = useTranslations("common");
  const isTextBased = textCategories.includes(category);

  const steps = [
    {
      icon: Upload,
      title: t(isTextBased ? "howItWorks.step1TextTitle" : "howItWorks.step1FileTitle"),
      description: t(isTextBased ? "howItWorks.step1TextDesc" : "howItWorks.step1FileDesc"),
    },
    {
      icon: Settings,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
    },
    {
      icon: Download,
      title: t(isTextBased ? "howItWorks.step3TextTitle" : "howItWorks.step3FileTitle"),
      description: t(isTextBased ? "howItWorks.step3TextDesc" : "howItWorks.step3FileDesc"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {i + 1}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
