import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "extract-text",
  category: "pdf",
  icon: "FileSearch",
  featured: false,
  component: () => import("./ExtractText"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.extract-text.faq.q1",
      answerKey: "tools.pdf.extract-text.faq.a1",
    },
    {
      questionKey: "tools.pdf.extract-text.faq.q2",
      answerKey: "tools.pdf.extract-text.faq.a2",
    },
  ],
  relatedSlugs: ["to-image", "merge", "split"],
};

export default definition;
