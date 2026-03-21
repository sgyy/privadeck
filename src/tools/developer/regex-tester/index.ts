import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "regex-tester",
  category: "developer",
  icon: "Regex",
  featured: false,
  component: () => import("./RegexTester"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.regex-tester.faq.q1",
      answerKey: "tools.developer.regex-tester.faq.a1",
    },
    {
      questionKey: "tools.developer.regex-tester.faq.q2",
      answerKey: "tools.developer.regex-tester.faq.a2",
    },
  
    {
      questionKey: "tools.developer.regex-tester.faq.q3",
      answerKey: "tools.developer.regex-tester.faq.a3",
    },
    {
      questionKey: "tools.developer.regex-tester.faq.q4",
      answerKey: "tools.developer.regex-tester.faq.a4",
    },
    {
      questionKey: "tools.developer.regex-tester.faq.q5",
      answerKey: "tools.developer.regex-tester.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "csv-json", "base64"],
};

export default definition;
