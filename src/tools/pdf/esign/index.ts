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
  ],
  relatedSlugs: ["add-watermark", "add-page-numbers", "merge"],
};

export default definition;
