import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "split",
  category: "pdf",
  icon: "FileText",
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
  ],
  relatedSlugs: ["merge", "delete-pages", "to-image"],
};

export default definition;
