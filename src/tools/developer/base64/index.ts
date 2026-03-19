import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "base64",
  category: "developer",
  icon: "Binary",
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
  ],
  relatedSlugs: ["json-formatter", "url-encoder"],
};

export default definition;
