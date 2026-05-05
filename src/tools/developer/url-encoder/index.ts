import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "url-encoder",
  category: "developer",
  icon: "Link",
  featured: true,
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
      questionKey: "common.sharedFaq.q3",
      answerKey: "common.sharedFaq.a3",
    },
    {
      questionKey: "common.sharedFaq.q4",
      answerKey: "common.sharedFaq.a4",
    },
    {
      questionKey: "tools.developer.url-encoder.faq.q5",
      answerKey: "tools.developer.url-encoder.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "base64"],
};

export default definition;
