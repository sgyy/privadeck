import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "lorem-ipsum",
  category: "text",
  icon: "FileText",
  component: () => import("./LoremIpsum"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.text.lorem-ipsum.faq.q1",
      answerKey: "tools.text.lorem-ipsum.faq.a1",
    },
    {
      questionKey: "tools.text.lorem-ipsum.faq.q2",
      answerKey: "tools.text.lorem-ipsum.faq.a2",
    },
  ],
  relatedSlugs: ["word-counter", "case-converter"],
};

export default definition;
