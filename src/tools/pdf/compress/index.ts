import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "compress",
  category: "pdf",
  icon: "FileDown",
  featured: false,
  component: () => import("./CompressPdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.compress.faq.q1",
      answerKey: "tools.pdf.compress.faq.a1",
    },
    {
      questionKey: "tools.pdf.compress.faq.q2",
      answerKey: "tools.pdf.compress.faq.a2",
    },
  
    {
      questionKey: "tools.pdf.compress.faq.q3",
      answerKey: "tools.pdf.compress.faq.a3",
    },
    {
      questionKey: "tools.pdf.compress.faq.q4",
      answerKey: "tools.pdf.compress.faq.a4",
    },
    {
      questionKey: "tools.pdf.compress.faq.q5",
      answerKey: "tools.pdf.compress.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "images-to-pdf", "rotate"],
};

export default definition;
