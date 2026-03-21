import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "crop",
  category: "image",
  icon: "Image",
  featured: false,
  component: () => import("./ImageCrop"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.crop.faq.q1",
      answerKey: "tools.image.crop.faq.a1",
    },
    {
      questionKey: "tools.image.crop.faq.q2",
      answerKey: "tools.image.crop.faq.a2",
    },
  
    {
      questionKey: "tools.image.crop.faq.q3",
      answerKey: "tools.image.crop.faq.a3",
    },
    {
      questionKey: "tools.image.crop.faq.q4",
      answerKey: "tools.image.crop.faq.a4",
    },
    {
      questionKey: "tools.image.crop.faq.q5",
      answerKey: "tools.image.crop.faq.a5",
    },
  ],
  relatedSlugs: ["resize", "compress", "watermark"],
};

export default definition;
