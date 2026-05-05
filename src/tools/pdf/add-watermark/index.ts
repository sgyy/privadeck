import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "add-watermark",
  category: "pdf",
  icon: "Stamp",
  featured: false,
  component: () => import("./AddWatermarkPdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.add-watermark.faq.q1",
      answerKey: "tools.pdf.add-watermark.faq.a1",
    },
    {
      questionKey: "tools.pdf.add-watermark.faq.q2",
      answerKey: "tools.pdf.add-watermark.faq.a2",
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
      questionKey: "tools.pdf.add-watermark.faq.q5",
      answerKey: "tools.pdf.add-watermark.faq.a5",
    },
  ],
  relatedSlugs: ["add-page-numbers", "rotate", "merge"],
};

export default definition;
