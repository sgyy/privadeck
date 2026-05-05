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
  
    {
      questionKey: "common.sharedFaq.q3",
      answerKey: "common.sharedFaq.a3",
    },
    {
      questionKey: "common.sharedFaq.q4",
      answerKey: "common.sharedFaq.a4",
    },
    {
      questionKey: "tools.pdf.delete-pages.faq.q5",
      answerKey: "tools.pdf.delete-pages.faq.a5",
    },
  ],
  relatedSlugs: ["merge", "split", "to-image"],
};

export default definition;
