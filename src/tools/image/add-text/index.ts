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
  
    {
      questionKey: "tools.image.add-text.faq.q3",
      answerKey: "tools.image.add-text.faq.a3",
    },
    {
      questionKey: "tools.image.add-text.faq.q4",
      answerKey: "tools.image.add-text.faq.a4",
    },
    {
      questionKey: "tools.image.add-text.faq.q5",
      answerKey: "tools.image.add-text.faq.a5",
    },
  ],
  relatedSlugs: ["watermark", "crop", "resize"],
};

export default definition;
