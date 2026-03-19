import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "delete-pages",
  category: "pdf",
  icon: "FileText",
  featured: false,
  component: () => import("./DeletePages"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.delete-pages.faq.q1",
      answerKey: "tools.pdf.delete-pages.faq.a1",
    },
    {
      questionKey: "tools.pdf.delete-pages.faq.q2",
      answerKey: "tools.pdf.delete-pages.faq.a2",
    },
  ],
  relatedSlugs: ["merge", "split", "to-image"],
};

export default definition;
