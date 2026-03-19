import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "hash-generator",
  category: "developer",
  icon: "Hash",
  featured: false,
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
  ],
  relatedSlugs: ["base64", "url-encoder", "json-formatter"],
};

export default definition;
