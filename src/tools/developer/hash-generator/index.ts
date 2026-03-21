import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "hash-generator",
  category: "developer",
  icon: "Hash",
  featured: true,
  component: () => import("./HashGenerator"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.hash-generator.faq.q1",
      answerKey: "tools.developer.hash-generator.faq.a1",
    },
    {
      questionKey: "tools.developer.hash-generator.faq.q2",
      answerKey: "tools.developer.hash-generator.faq.a2",
    },
  
    {
      questionKey: "tools.developer.hash-generator.faq.q3",
      answerKey: "tools.developer.hash-generator.faq.a3",
    },
    {
      questionKey: "tools.developer.hash-generator.faq.q4",
      answerKey: "tools.developer.hash-generator.faq.a4",
    },
    {
      questionKey: "tools.developer.hash-generator.faq.q5",
      answerKey: "tools.developer.hash-generator.faq.a5",
    },
  ],
  relatedSlugs: ["base64", "url-encoder", "json-formatter"],
};

export default definition;
