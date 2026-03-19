import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "to-image",
  category: "pdf",
  icon: "FileText",
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
  ],
  relatedSlugs: ["merge", "split", "delete-pages"],
};

export default definition;
