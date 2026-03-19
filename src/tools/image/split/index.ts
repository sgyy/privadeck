import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "split",
  category: "image",
  icon: "Grid2x2",
  featured: false,
  component: () => import("./SplitImage"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.split.faq.q1",
      answerKey: "tools.image.split.faq.a1",
    },
    {
      questionKey: "tools.image.split.faq.q2",
      answerKey: "tools.image.split.faq.a2",
    },
  ],
  relatedSlugs: ["crop", "resize", "combine"],
};

export default definition;
