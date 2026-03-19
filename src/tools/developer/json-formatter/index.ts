import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "json-formatter",
  category: "developer",
  icon: "Braces",
  featured: true,
  component: () => import("./JsonFormatter"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.json-formatter.faq.q1",
      answerKey: "tools.developer.json-formatter.faq.a1",
    },
    {
      questionKey: "tools.developer.json-formatter.faq.q2",
      answerKey: "tools.developer.json-formatter.faq.a2",
    },
  ],
  relatedSlugs: ["base64", "url-encoder"],
};

export default definition;
