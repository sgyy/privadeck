import type { Metadata } from "next";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import { NotFound404 } from "@/components/shared/NotFound404";
import enCommon from "../../../messages/en/common.json";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const toolNames = enCommon.toolNames as Record<
  string,
  Record<string, { name: string; description: string }>
>;

export default function NotFound() {
  const tools = getAllTools().map((t) => ({
    slug: t.slug,
    category: t.category,
    name: toolNames[t.category]?.[t.slug]?.name ?? t.slug,
    description: toolNames[t.category]?.[t.slug]?.description ?? "",
  }));

  const cats = categories.map((c) => ({
    key: c.key,
    label: enCommon.categories[c.key as keyof typeof enCommon.categories].name,
  }));

  return <NotFound404 tools={tools} categories={cats} pathPrefix="/en" />;
}
