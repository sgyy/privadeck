import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "word-counter",
  category: "developer",
  icon: "Type",
  featured: true,
  component: () => import("./WordCounter"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.word-counter.faq.q1",
      answerKey: "tools.developer.word-counter.faq.a1",
    },
    {
      questionKey: "tools.developer.word-counter.faq.q2",
      answerKey: "tools.developer.word-counter.faq.a2",
    },
    {
      questionKey: "tools.developer.word-counter.faq.q3",
      answerKey: "tools.developer.word-counter.faq.a3",
    },
  ],
  relatedSlugs: ["case-converter", "lorem-ipsum"],
};

export default definition;
