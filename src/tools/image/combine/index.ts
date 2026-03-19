import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "combine",
  category: "image",
  icon: "Columns",
  featured: false,
  component: () => import("./CombineImages"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.combine.faq.q1",
      answerKey: "tools.image.combine.faq.a1",
    },
    {
      questionKey: "tools.image.combine.faq.q2",
      answerKey: "tools.image.combine.faq.a2",
    },
  ],
  relatedSlugs: ["crop", "resize", "split"],
};

export default definition;
