import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "split",
  category: "pdf",
  icon: "FileOutput",
  featured: true,
  component: () => import("./SplitPdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.split.faq.q1",
      answerKey: "tools.pdf.split.faq.a1",
    },
    {
      questionKey: "tools.pdf.split.faq.q2",
      answerKey: "tools.pdf.split.faq.a2",
    },
  
    {
      questionKey: "tools.pdf.split.faq.q3",
      answerKey: "tools.pdf.split.faq.a3",
    },
    {
      questionKey: "tools.pdf.split.faq.q4",
      answerKey: "tools.pdf.split.faq.a4",
    },
    {
      questionKey: "tools.pdf.split.faq.q5",
      answerKey: "tools.pdf.split.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "delete-pages", "to-image"],
};

export default definition;
