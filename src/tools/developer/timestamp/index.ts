import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "timestamp",
  category: "developer",
  icon: "Clock",
  featured: false,
  component: () => import("./Timestamp"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.timestamp.faq.q1",
      answerKey: "tools.developer.timestamp.faq.a1",
    },
    {
      questionKey: "tools.developer.timestamp.faq.q2",
      answerKey: "tools.developer.timestamp.faq.a2",
    },
  
    {
      questionKey: "tools.developer.timestamp.faq.q3",
      answerKey: "tools.developer.timestamp.faq.a3",
    },
    {
      questionKey: "tools.developer.timestamp.faq.q4",
      answerKey: "tools.developer.timestamp.faq.a4",
    },
    {
      questionKey: "tools.developer.timestamp.faq.q5",
      answerKey: "tools.developer.timestamp.faq.a5",
    },
  ],
  relatedSlugs: ["hash-generator", "base64", "url-encoder"],
};

export default definition;
