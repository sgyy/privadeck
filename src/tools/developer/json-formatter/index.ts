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
  
    {
      questionKey: "tools.developer.json-formatter.faq.q3",
      answerKey: "tools.developer.json-formatter.faq.a3",
    },
    {
      questionKey: "tools.developer.json-formatter.faq.q4",
      answerKey: "tools.developer.json-formatter.faq.a4",
    },
    {
      questionKey: "tools.developer.json-formatter.faq.q5",
      answerKey: "tools.developer.json-formatter.faq.a5",
    },
  ],
  relatedSlugs: ["json-editor", "yaml-json", "base64"],
};

export default definition;
