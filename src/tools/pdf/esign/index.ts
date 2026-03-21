import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "esign",
  category: "pdf",
  icon: "PenLine",
  featured: false,
  component: () => import("./ESign"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.esign.faq.q1",
      answerKey: "tools.pdf.esign.faq.a1",
    },
    {
      questionKey: "tools.pdf.esign.faq.q2",
      answerKey: "tools.pdf.esign.faq.a2",
    },
  
    {
      questionKey: "tools.pdf.esign.faq.q3",
      answerKey: "tools.pdf.esign.faq.a3",
    },
    {
      questionKey: "tools.pdf.esign.faq.q4",
      answerKey: "tools.pdf.esign.faq.a4",
    },
    {
      questionKey: "tools.pdf.esign.faq.q5",
      answerKey: "tools.pdf.esign.faq.a5",
    },
  ],
  relatedSlugs: ["add-watermark", "add-page-numbers", "merge"],
};

export default definition;
