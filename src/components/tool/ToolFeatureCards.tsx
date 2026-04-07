"use client";

import { useTranslations } from "next-intl";
import {
  Star,
  Gauge,
  Shield,
  BarChart3,
  MonitorDown,
  Zap,
  FileVideo,
  Braces,
  TreePine,
  Search,
  GripVertical,
  Eye,
} from "lucide-react";
import type { ComponentType } from "react";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Star,
  Gauge,
  Shield,
  BarChart3,
  MonitorDown,
  Zap,
  FileVideo,
  Braces,
  TreePine,
  Search,
  GripVertical,
  Eye,
};

interface ToolFeatureCardsProps {
  tool: { category: string; slug: string };
}

export function ToolFeatureCards({ tool }: ToolFeatureCardsProps) {
  const t = useTranslations(`tools.${tool.category}.${tool.slug}`);
  const tc = useTranslations("common");

  // Check if featureCards exist
  if (!t.has("featureCards.count")) return null;
  const count = Number(t.raw("featureCards.count"));
  if (!count || count <= 0) return null;

  const cards: { icon: string; title: string; description: string }[] = [];
  for (let i = 1; i <= count; i++) {
    if (!t.has(`featureCards.f${i}.title`)) break;
    cards.push({
      icon: t(`featureCards.f${i}.icon`),
      title: t(`featureCards.f${i}.title`),
      description: t(`featureCards.f${i}.description`),
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="mt-10 space-y-5">
      <h2 className="text-lg font-semibold">{tc("featureHighlights")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = ICON_MAP[card.icon] ?? Star;
          return (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-muted/30 p-6 space-y-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
