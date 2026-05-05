import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "rotate",
  category: "pdf",
  icon: "RotateCw",
  featured: false,
  component: () => import("./RotatePdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.rotate.faq.q1",
      answerKey: "tools.pdf.rotate.faq.a1",
    },
    {
      questionKey: "tools.pdf.rotate.faq.q2",
      answerKey: "tools.pdf.rotate.faq.a2",
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
      questionKey: "tools.pdf.rotate.faq.q5",
      answerKey: "tools.pdf.rotate.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "split", "delete-pages"],
};

export default definition;
