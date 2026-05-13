"use client";

import { useTranslations } from "next-intl";
import { BookOpen, Sparkles, ShieldCheck, Shield, Zap } from "lucide-react";
import type { ComponentType } from "react";

const DEFAULT_SECTIONS = ["intro", "useCases", "privacy"] as const;

interface SectionStyle {
  Icon: ComponentType<{ className?: string }>;
  accentBar: string;
  iconBg: string;
  iconColor: string;
  anchor: string;
}

const SECTION_STYLES: Record<string, SectionStyle> = {
  intro: {
    Icon: BookOpen,
    accentBar: "before:bg-cyan-500 dark:before:bg-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-300",
    anchor: "what-is",
  },
  useCases: {
    Icon: Sparkles,
    accentBar: "before:bg-amber-500 dark:before:bg-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-300",
    anchor: "use-cases",
  },
  privacy: {
    Icon: ShieldCheck,
    accentBar: "before:bg-emerald-500 dark:before:bg-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    anchor: "privacy",
  },
};

const FALLBACK_STYLE: SectionStyle = SECTION_STYLES.intro;

interface ToolDescriptionProps {
  tool: { category: string; slug: string };
  sections?: string[];
}

function RichContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-strong:text-foreground prose-strong:font-semibold prose-li:my-1 prose-p:leading-relaxed prose-ul:my-2 prose-headings:font-semibold"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ToolDescription({ tool, sections }: ToolDescriptionProps) {
  const sectionKeys: string[] = sections ?? [...DEFAULT_SECTIONS];
  const t = useTranslations(`tools.${tool.category}.${tool.slug}`);
  const tc = useTranslations("common");

  const hasAnyContent = sectionKeys.some((s) => t.has(`seoContent.${s}.content`));
  const aiSummary = t.has("aiSummary") ? t("aiSummary") : null;

  if (!hasAnyContent && !aiSummary) return null;

  return (
    <section
      id="about-this-tool"
      aria-labelledby="about-this-tool-heading"
      className="mt-12 scroll-mt-24"
    >
      <header className="mb-6 flex items-center gap-3">
        <div
          aria-hidden="true"
          className="h-7 w-1.5 rounded-full bg-gradient-to-b from-cyan-500 to-emerald-500"
        />
        <h2
          id="about-this-tool-heading"
          className="text-xl font-bold tracking-tight"
        >
          {tc("aboutThisTool")}
        </h2>
      </header>

      {aiSummary && (
        <div
          className="mb-5 rounded-2xl border border-border/60 bg-gradient-to-br from-cyan-50/70 via-card to-emerald-50/50 dark:from-cyan-500/5 dark:via-card dark:to-emerald-500/5 p-5 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-3">
              <p className="text-sm leading-relaxed text-foreground">
                {aiSummary}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-300">
                  <Shield className="h-3.5 w-3.5" />
                  {tc("localOnlyIndicator")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sectionKeys.map((section) => {
          if (!t.has(`seoContent.${section}.content`)) return null;
          const localTitleKey = `seoContent.${section}.title`;
          const title = t.has(localTitleKey)
            ? t(localTitleKey)
            : tc.has(`seoContent.${section}.title`)
              ? tc(`seoContent.${section}.title`)
              : null;
          if (title === null) return null;
          const content = t.raw(`seoContent.${section}.content`) as string;
          const style = SECTION_STYLES[section] ?? FALLBACK_STYLE;
          const Icon = style.Icon;
          const headingId = `${style.anchor}-heading`;
          return (
            <article
              key={section}
              id={style.anchor}
              aria-labelledby={headingId}
              className={`relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${style.accentBar} scroll-mt-24`}
            >
              <header className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${style.iconColor}`} />
                </div>
                <h3
                  id={headingId}
                  className="text-base font-semibold leading-tight"
                >
                  {title}
                </h3>
              </header>
              <RichContent html={content} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
