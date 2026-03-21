import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "color-converter",
  category: "developer",
  icon: "Palette",
  featured: false,
  component: () => import("./ColorConverter"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.color-converter.faq.q1",
      answerKey: "tools.developer.color-converter.faq.a1",
    },
    {
      questionKey: "tools.developer.color-converter.faq.q2",
      answerKey: "tools.developer.color-converter.faq.a2",
    },
  
    {
      questionKey: "tools.developer.color-converter.faq.q3",
      answerKey: "tools.developer.color-converter.faq.a3",
    },
    {
      questionKey: "tools.developer.color-converter.faq.q4",
      answerKey: "tools.developer.color-converter.faq.a4",
    },
    {
      questionKey: "tools.developer.color-converter.faq.q5",
      answerKey: "tools.developer.color-converter.faq.a5",
    },
  ],
  relatedSlugs: ["base64", "url-encoder", "json-formatter"],
};

export default definition;
