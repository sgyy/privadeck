import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "case-converter",
  category: "text",
  icon: "CaseSensitive",
  component: () => import("./CaseConverter"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.text.case-converter.faq.q1",
      answerKey: "tools.text.case-converter.faq.a1",
    },
    {
      questionKey: "tools.text.case-converter.faq.q2",
      answerKey: "tools.text.case-converter.faq.a2",
    },
  ],
  relatedSlugs: ["word-counter", "lorem-ipsum"],
};

export default definition;
