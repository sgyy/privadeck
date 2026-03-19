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
  ],
  relatedSlugs: ["crop", "resize", "grayscale"],
};

export default definition;
