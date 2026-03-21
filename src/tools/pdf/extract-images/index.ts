import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "extract-images",
  category: "pdf",
  icon: "ImageDown",
  featured: false,
  component: () => import("./ExtractImages"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.extract-images.faq.q1",
      answerKey: "tools.pdf.extract-images.faq.a1",
    },
    {
      questionKey: "tools.pdf.extract-images.faq.q2",
      answerKey: "tools.pdf.extract-images.faq.a2",
    },
  
    {
      questionKey: "tools.pdf.extract-images.faq.q3",
      answerKey: "tools.pdf.extract-images.faq.a3",
    },
    {
      questionKey: "tools.pdf.extract-images.faq.q4",
      answerKey: "tools.pdf.extract-images.faq.a4",
    },
    {
      questionKey: "tools.pdf.extract-images.faq.q5",
      answerKey: "tools.pdf.extract-images.faq.a5",
    },
  ],
  relatedSlugs: ["to-image", "extract-text", "split"],
};

export default definition;
