import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "merge",
  category: "pdf",
  icon: "FilePlus2",
  featured: true,
  component: () => import("./MergePdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.merge.faq.q1",
      answerKey: "tools.pdf.merge.faq.a1",
    },
    {
      questionKey: "tools.pdf.merge.faq.q2",
      answerKey: "tools.pdf.merge.faq.a2",
    },
    {
      questionKey: "tools.pdf.merge.faq.q3",
      answerKey: "tools.pdf.merge.faq.a3",
    },
    {
      questionKey: "tools.pdf.merge.faq.q4",
      answerKey: "tools.pdf.merge.faq.a4",
    },
    {
      questionKey: "tools.pdf.merge.faq.q5",
      answerKey: "tools.pdf.merge.faq.a5",
    },
    {
      questionKey: "tools.pdf.merge.faq.q6",
      answerKey: "tools.pdf.merge.faq.a6",
    },
    {
      questionKey: "tools.pdf.merge.faq.q7",
      answerKey: "tools.pdf.merge.faq.a7",
    },
    {
      questionKey: "tools.pdf.merge.faq.q8",
      answerKey: "tools.pdf.merge.faq.a8",
    },
  ],
  relatedSlugs: ["split", "delete-pages", "to-image"],
};

export default definition;
