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
  ],
  relatedSlugs: ["hash-generator", "base64", "url-encoder"],
};

export default definition;
