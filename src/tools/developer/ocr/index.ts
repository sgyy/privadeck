import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "ocr",
  category: "developer",
  icon: "Code",
  featured: false,
  component: () => import("./Ocr"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.ocr.faq.q1",
      answerKey: "tools.developer.ocr.faq.a1",
    },
    {
      questionKey: "tools.developer.ocr.faq.q2",
      answerKey: "tools.developer.ocr.faq.a2",
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
      questionKey: "tools.developer.ocr.faq.q5",
      answerKey: "tools.developer.ocr.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "base64"],
};

export default definition;
