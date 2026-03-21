import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "rearrange",
  category: "pdf",
  icon: "ArrowUpDown",
  featured: false,
  component: () => import("./RearrangePdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.rearrange.faq.q1",
      answerKey: "tools.pdf.rearrange.faq.a1",
    },
    {
      questionKey: "tools.pdf.rearrange.faq.q2",
      answerKey: "tools.pdf.rearrange.faq.a2",
    },
  
    {
      questionKey: "tools.pdf.rearrange.faq.q3",
      answerKey: "tools.pdf.rearrange.faq.a3",
    },
    {
      questionKey: "tools.pdf.rearrange.faq.q4",
      answerKey: "tools.pdf.rearrange.faq.a4",
    },
    {
      questionKey: "tools.pdf.rearrange.faq.q5",
      answerKey: "tools.pdf.rearrange.faq.a5",
    },
  ],
  relatedSlugs: ["rotate", "delete-pages", "merge"],
};

export default definition;
