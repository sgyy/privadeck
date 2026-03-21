import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "pixelate",
  category: "image",
  icon: "Grid3x3",
  featured: false,
  component: () => import("./Pixelate"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.pixelate.faq.q1",
      answerKey: "tools.image.pixelate.faq.a1",
    },
    {
      questionKey: "tools.image.pixelate.faq.q2",
      answerKey: "tools.image.pixelate.faq.a2",
    },
  
    {
      questionKey: "tools.image.pixelate.faq.q3",
      answerKey: "tools.image.pixelate.faq.a3",
    },
    {
      questionKey: "tools.image.pixelate.faq.q4",
      answerKey: "tools.image.pixelate.faq.a4",
    },
    {
      questionKey: "tools.image.pixelate.faq.q5",
      answerKey: "tools.image.pixelate.faq.a5",
    },
  ],
  relatedSlugs: ["crop", "resize", "grayscale"],
};

export default definition;
