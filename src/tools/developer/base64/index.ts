import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "base64",
  category: "developer",
  icon: "Binary",
  featured: true,
  component: () => import("./Base64Tool"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.base64.faq.q1",
      answerKey: "tools.developer.base64.faq.a1",
    },
    {
      questionKey: "tools.developer.base64.faq.q2",
      answerKey: "tools.developer.base64.faq.a2",
    },
    {
      questionKey: "tools.developer.base64.faq.q3",
      answerKey: "tools.developer.base64.faq.a3",
    },
    {
      questionKey: "tools.developer.base64.faq.q4",
      answerKey: "tools.developer.base64.faq.a4",
    },
    {
      questionKey: "tools.developer.base64.faq.q5",
      answerKey: "tools.developer.base64.faq.a5",
    },
    {
      questionKey: "tools.developer.base64.faq.q6",
      answerKey: "tools.developer.base64.faq.a6",
    },
  ],
  relatedSlugs: ["json-formatter", "url-encoder", "hash-generator"],
};

export default definition;
