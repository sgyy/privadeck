import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "add-text",
  category: "image",
  icon: "Type",
  featured: false,
  component: () => import("./AddText"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.add-text.faq.q1",
      answerKey: "tools.image.add-text.faq.a1",
    },
    {
      questionKey: "tools.image.add-text.faq.q2",
      answerKey: "tools.image.add-text.faq.a2",
    },
  ],
  relatedSlugs: ["watermark", "crop", "resize"],
};

export default definition;
