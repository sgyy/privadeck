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
    iconBgDark: "dark:bg-cyan-400/15",
    iconColor: "text-cyan-600",
    iconColorDark: "dark:text-cyan-400",
    badgeBg: "bg-cyan-50 text-cyan-700",
    badgeBgDark: "dark:bg-cyan-900/30 dark:text-cyan-300",
    hoverBorder: "hover:border-cyan-200 dark:hover:border-cyan-800",
    heroBg: "from-cyan-50/80 to-teal-50/40",
    heroBgDark: "dark:from-cyan-950/20 dark:to-teal-950/10",
  },
  video: {
    key: "video",
    gradient: "from-teal-500 to-emerald-500",
    iconBg: "bg-teal-500/10",
    iconBgDark: "dark:bg-teal-400/15",
    iconColor: "text-teal-600",
    iconColorDark: "dark:text-teal-400",
    badgeBg: "bg-teal-50 text-teal-700",
    badgeBgDark: "dark:bg-teal-900/30 dark:text-teal-300",
    hoverBorder: "hover:border-teal-200 dark:hover:border-teal-800",
    heroBg: "from-teal-50/80 to-emerald-50/40",
    heroBgDark: "dark:from-teal-950/20 dark:to-emerald-950/10",
  },
  audio: {
    key: "audio",
    gradient: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/10",
    iconBgDark: "dark:bg-emerald-400/15",
    iconColor: "text-emerald-600",
    iconColorDark: "dark:text-emerald-400",
    badgeBg: "bg-emerald-50 text-emerald-700",
    badgeBgDark: "dark:bg-emerald-900/30 dark:text-emerald-300",
    hoverBorder: "hover:border-emerald-200 dark:hover:border-emerald-800",
    heroBg: "from-emerald-50/80 to-green-50/40",
    heroBgDark: "dark:from-emerald-950/20 dark:to-green-950/10",
  },
  pdf: {
    key: "pdf",
    gradient: "from-sky-500 to-cyan-500",
    iconBg: "bg-sky-500/10",
    iconBgDark: "dark:bg-sky-400/15",
    iconColor: "text-sky-600",
    iconColorDark: "dark:text-sky-400",
    badgeBg: "bg-sky-50 text-sky-700",
    badgeBgDark: "dark:bg-sky-900/30 dark:text-sky-300",
    hoverBorder: "hover:border-sky-200 dark:hover:border-sky-800",
    heroBg: "from-sky-50/80 to-cyan-50/40",
    heroBgDark: "dark:from-sky-950/20 dark:to-cyan-950/10",
  },
  developer: {
    key: "developer",
    gradient: "from-indigo-500 to-cyan-500",
    iconBg: "bg-indigo-500/10",
    iconBgDark: "dark:bg-indigo-400/15",
    iconColor: "text-indigo-600",
    iconColorDark: "dark:text-indigo-400",
    badgeBg: "bg-indigo-50 text-indigo-700",
    badgeBgDark: "dark:bg-indigo-900/30 dark:text-indigo-300",
    hoverBorder: "hover:border-indigo-200 dark:hover:border-indigo-800",
    heroBg: "from-indigo-50/80 to-cyan-50/40",
    heroBgDark: "dark:from-indigo-950/20 dark:to-cyan-950/10",
  },
};

export function getCategoryTheme(category: ToolCategory): CategoryTheme {
  return themes[category];
}

export function getAllCategoryThemes(): CategoryTheme[] {
  return Object.values(themes);
}
