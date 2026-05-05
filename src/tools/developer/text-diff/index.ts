import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "text-diff",
  category: "developer",
  icon: "FileDiff",
  featured: false,
  component: () => import("./TextDiff"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.text-diff.faq.q1",
      answerKey: "tools.developer.text-diff.faq.a1",
    },
    {
      questionKey: "tools.developer.text-diff.faq.q2",
      answerKey: "tools.developer.text-diff.faq.a2",
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
      questionKey: "tools.developer.text-diff.faq.q5",
      answerKey: "tools.developer.text-diff.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "markdown-preview", "regex-tester"],
};

export default definition;
