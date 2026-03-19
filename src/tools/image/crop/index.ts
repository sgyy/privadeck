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
  ],
  relatedSlugs: ["resize", "compress", "watermark"],
};

export default definition;
