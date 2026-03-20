import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "case-converter",
  category: "developer",
  icon: "CaseSensitive",
  component: () => import("./CaseConverter"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.case-converter.faq.q1",
      answerKey: "tools.developer.case-converter.faq.a1",
    },
    {
      questionKey: "tools.developer.case-converter.faq.q2",
      answerKey: "tools.developer.case-converter.faq.a2",
    },
  ],
  relatedSlugs: ["word-counter", "lorem-ipsum"],
};

export default definition;
