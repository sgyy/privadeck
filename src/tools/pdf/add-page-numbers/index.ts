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
      questionKey: "tools.pdf.add-page-numbers.faq.q3",
      answerKey: "tools.pdf.add-page-numbers.faq.a3",
    },
    {
      questionKey: "tools.pdf.add-page-numbers.faq.q4",
      answerKey: "tools.pdf.add-page-numbers.faq.a4",
    },
    {
      questionKey: "tools.pdf.add-page-numbers.faq.q5",
      answerKey: "tools.pdf.add-page-numbers.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "rotate"],
};

export default definition;
