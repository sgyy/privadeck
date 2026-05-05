import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "images-to-pdf",
  category: "pdf",
  icon: "ImagePlus",
  featured: false,
  component: () => import("./ImagesToPdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.images-to-pdf.faq.q1",
      answerKey: "tools.pdf.images-to-pdf.faq.a1",
    },
    {
      questionKey: "tools.pdf.images-to-pdf.faq.q2",
      answerKey: "tools.pdf.images-to-pdf.faq.a2",
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
      questionKey: "tools.pdf.images-to-pdf.faq.q5",
      answerKey: "tools.pdf.images-to-pdf.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "to-image"],
};

export default definition;
