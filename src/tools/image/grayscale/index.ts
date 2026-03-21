import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "grayscale",
  category: "image",
  icon: "Contrast",
  featured: false,
  component: () => import("./Grayscale"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.grayscale.faq.q1",
      answerKey: "tools.image.grayscale.faq.a1",
    },
    {
      questionKey: "tools.image.grayscale.faq.q2",
      answerKey: "tools.image.grayscale.faq.a2",
    },
  
    {
      questionKey: "tools.image.grayscale.faq.q3",
      answerKey: "tools.image.grayscale.faq.a3",
    },
    {
      questionKey: "tools.image.grayscale.faq.q4",
      answerKey: "tools.image.grayscale.faq.a4",
    },
    {
      questionKey: "tools.image.grayscale.faq.q5",
      answerKey: "tools.image.grayscale.faq.a5",
    },
  ],
  relatedSlugs: ["crop", "compress", "format-converter"],
};

export default definition;
