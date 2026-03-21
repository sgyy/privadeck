import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "archive",
  category: "developer",
  icon: "Code",
  featured: false,
  component: () => import("./Archive"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.archive.faq.q1",
      answerKey: "tools.developer.archive.faq.a1",
    },
    {
      questionKey: "tools.developer.archive.faq.q2",
      answerKey: "tools.developer.archive.faq.a2",
    },
  
    {
      questionKey: "tools.developer.archive.faq.q3",
      answerKey: "tools.developer.archive.faq.a3",
    },
    {
      questionKey: "tools.developer.archive.faq.q4",
      answerKey: "tools.developer.archive.faq.a4",
    },
    {
      questionKey: "tools.developer.archive.faq.q5",
      answerKey: "tools.developer.archive.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "base64"],
};

export default definition;
