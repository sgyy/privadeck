import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "add-border",
  category: "image",
  icon: "Square",
  featured: false,
  component: () => import("./AddBorder"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.add-border.faq.q1",
      answerKey: "tools.image.add-border.faq.a1",
    },
    {
      questionKey: "tools.image.add-border.faq.q2",
      answerKey: "tools.image.add-border.faq.a2",
    },
  ],
  relatedSlugs: ["crop", "resize", "watermark"],
};

export default definition;
