import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "crop",
  category: "pdf",
  icon: "Crop",
  featured: false,
  component: () => import("./CropPdf"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.pdf.crop.faq.q1",
      answerKey: "tools.pdf.crop.faq.a1",
    },
    {
      questionKey: "tools.pdf.crop.faq.q2",
      answerKey: "tools.pdf.crop.faq.a2",
    },
  
    {
      questionKey: "tools.pdf.crop.faq.q3",
      answerKey: "tools.pdf.crop.faq.a3",
    },
    {
      questionKey: "tools.pdf.crop.faq.q4",
      answerKey: "tools.pdf.crop.faq.a4",
    },
    {
      questionKey: "tools.pdf.crop.faq.q5",
      answerKey: "tools.pdf.crop.faq.a5",
    },
  ],
  relatedSlugs: ["rotate", "delete-pages", "add-page-numbers"],
};

export default definition;
