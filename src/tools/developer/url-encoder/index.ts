import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "url-encoder",
  category: "developer",
  icon: "Link",
  component: () => import("./UrlEncoder"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.url-encoder.faq.q1",
      answerKey: "tools.developer.url-encoder.faq.a1",
    },
    {
      questionKey: "tools.developer.url-encoder.faq.q2",
      answerKey: "tools.developer.url-encoder.faq.a2",
    },
  
    {
      questionKey: "tools.developer.url-encoder.faq.q3",
      answerKey: "tools.developer.url-encoder.faq.a3",
    },
    {
      questionKey: "tools.developer.url-encoder.faq.q4",
      answerKey: "tools.developer.url-encoder.faq.a4",
    },
    {
      questionKey: "tools.developer.url-encoder.faq.q5",
      answerKey: "tools.developer.url-encoder.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "base64"],
};

export default definition;
