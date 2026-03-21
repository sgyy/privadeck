import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "lorem-ipsum",
  category: "developer",
  icon: "FileText",
  component: () => import("./LoremIpsum"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.lorem-ipsum.faq.q1",
      answerKey: "tools.developer.lorem-ipsum.faq.a1",
    },
    {
      questionKey: "tools.developer.lorem-ipsum.faq.q2",
      answerKey: "tools.developer.lorem-ipsum.faq.a2",
    },
  
    {
      questionKey: "tools.developer.lorem-ipsum.faq.q3",
      answerKey: "tools.developer.lorem-ipsum.faq.a3",
    },
    {
      questionKey: "tools.developer.lorem-ipsum.faq.q4",
      answerKey: "tools.developer.lorem-ipsum.faq.a4",
    },
    {
      questionKey: "tools.developer.lorem-ipsum.faq.q5",
      answerKey: "tools.developer.lorem-ipsum.faq.a5",
    },
  ],
  relatedSlugs: ["word-counter", "case-converter"],
};

export default definition;
