import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "to-image",
  category: "pdf",
  icon: "FileImage",
  featured: true,
  component: () => import("./PdfToImage"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.to-image.faq.q1",
      answerKey: "tools.pdf.to-image.faq.a1",
    },
    {
      questionKey: "tools.pdf.to-image.faq.q2",
      answerKey: "tools.pdf.to-image.faq.a2",
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
      questionKey: "tools.pdf.to-image.faq.q5",
      answerKey: "tools.pdf.to-image.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "split", "delete-pages"],
};

export default definition;
