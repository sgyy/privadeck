import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "add-page-numbers",
  category: "pdf",
  icon: "Hash",
  featured: false,
  component: () => import("./AddPageNumbers"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.add-page-numbers.faq.q1",
      answerKey: "tools.pdf.add-page-numbers.faq.a1",
    },
    {
      questionKey: "tools.pdf.add-page-numbers.faq.q2",
      answerKey: "tools.pdf.add-page-numbers.faq.a2",
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
      questionKey: "tools.pdf.add-page-numbers.faq.q5",
      answerKey: "tools.pdf.add-page-numbers.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "rotate"],
};

export default definition;
