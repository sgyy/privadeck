import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "compress",
  category: "pdf",
  icon: "FileDown",
  featured: true,
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
      questionKey: "common.sharedFaq.q3",
      answerKey: "common.sharedFaq.a3",
    },
    {
      questionKey: "common.sharedFaq.q4",
      answerKey: "common.sharedFaq.a4",
    },
    {
      questionKey: "tools.pdf.compress.faq.q5",
      answerKey: "tools.pdf.compress.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "images-to-pdf", "rotate"],
};

export default definition;
