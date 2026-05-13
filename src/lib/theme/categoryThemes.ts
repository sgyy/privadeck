import type { ToolCategory } from "@/lib/registry/types";

export interface CategoryTheme {
  key: ToolCategory;
  gradient: string;
  iconBg: string;
  iconBgDark: string;
  iconColor: string;
  iconColorDark: string;
  badgeBg: string;
  badgeBgDark: string;
  hoverBorder: string;
  heroBg: string;
  heroBgDark: string;
}

// Unified tonal palette: all categories use the same cyan-teal family
// with subtle hue shifts for differentiation (not rainbow)
const themes: Record<ToolCategory, CategoryTheme> = {
  image: {
    key: "image",
    gradient: "from-cyan-500 to-teal-500",
    iconBg: "bg-cyan-500/10",
    iconBgDark: "dark:bg-cyan-400/10",
    iconColor: "text-cyan-600",
    iconColorDark: "dark:text-cyan-300",
    badgeBg: "bg-cyan-50 text-cyan-700",
    badgeBgDark: "dark:bg-cyan-500/10 dark:text-cyan-300",
    hoverBorder: "hover:border-cyan-200 dark:hover:border-cyan-700/50",
    heroBg: "from-cyan-50/80 to-teal-50/40",
    heroBgDark: "dark:from-cyan-950/30 dark:to-teal-950/15",
  },
  video: {
    key: "video",
    gradient: "from-teal-500 to-emerald-500",
    iconBg: "bg-teal-500/10",
    iconBgDark: "dark:bg-teal-400/10",
    iconColor: "text-teal-600",
    iconColorDark: "dark:text-teal-300",
    badgeBg: "bg-teal-50 text-teal-700",
    badgeBgDark: "dark:bg-teal-500/10 dark:text-teal-300",
    hoverBorder: "hover:border-teal-200 dark:hover:border-teal-700/50",
    heroBg: "from-teal-50/80 to-emerald-50/40",
    heroBgDark: "dark:from-teal-950/30 dark:to-emerald-950/15",
  },
  audio: {
    key: "audio",
    gradient: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/10",
    iconBgDark: "dark:bg-emerald-400/10",
    iconColor: "text-emerald-600",
    iconColorDark: "dark:text-emerald-300",
    badgeBg: "bg-emerald-50 text-emerald-700",
    badgeBgDark: "dark:bg-emerald-500/10 dark:text-emerald-300",
    hoverBorder: "hover:border-emerald-200 dark:hover:border-emerald-700/50",
    heroBg: "from-emerald-50/80 to-green-50/40",
    heroBgDark: "dark:from-emerald-950/30 dark:to-green-950/15",
  },
  pdf: {
    key: "pdf",
    gradient: "from-sky-500 to-cyan-500",
    iconBg: "bg-sky-500/10",
    iconBgDark: "dark:bg-sky-400/10",
    iconColor: "text-sky-600",
    iconColorDark: "dark:text-sky-300",
    badgeBg: "bg-sky-50 text-sky-700",
    badgeBgDark: "dark:bg-sky-500/10 dark:text-sky-300",
    hoverBorder: "hover:border-sky-200 dark:hover:border-sky-700/50",
    heroBg: "from-sky-50/80 to-cyan-50/40",
    heroBgDark: "dark:from-sky-950/30 dark:to-cyan-950/15",
  },
  developer: {
    key: "developer",
    gradient: "from-indigo-500 to-cyan-500",
    iconBg: "bg-indigo-500/10",
    iconBgDark: "dark:bg-indigo-400/10",
    iconColor: "text-indigo-600",
    iconColorDark: "dark:text-indigo-300",
    badgeBg: "bg-indigo-50 text-indigo-700",
    badgeBgDark: "dark:bg-indigo-500/10 dark:text-indigo-300",
    hoverBorder: "hover:border-indigo-200 dark:hover:border-indigo-700/50",
    heroBg: "from-indigo-50/80 to-cyan-50/40",
    heroBgDark: "dark:from-indigo-950/30 dark:to-cyan-950/15",
  },
};

export function getCategoryTheme(category: ToolCategory): CategoryTheme {
  return themes[category];
}

export function getAllCategoryThemes(): CategoryTheme[] {
  return Object.values(themes);
}
