import type { ComponentType } from "react";

export type ToolCategory = "text" | "developer" | "image" | "pdf" | "video" | "audio";

export interface ToolDefinition {
  slug: string;
  category: ToolCategory;
  icon: string; // Lucide icon name
  featured?: boolean; // Show in mega menu "Featured Tools" column
  component: () => Promise<{ default: ComponentType }>;
  seo: {
    structuredDataType: "WebApplication" | "SoftwareApplication";
  };
  faq?: { questionKey: string; answerKey: string }[];
  relatedSlugs?: string[];
}

export interface CategoryDefinition {
  key: ToolCategory;
  icon: string;
}
