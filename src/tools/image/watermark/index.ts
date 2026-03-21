import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "watermark",
  category: "image",
  icon: "Image",
  featured: false,
  component: () => import("./ImageWatermark"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.watermark.faq.q1",
      answerKey: "tools.image.watermark.faq.a1",
    },
    {
      questionKey: "tools.image.watermark.faq.q2",
      answerKey: "tools.image.watermark.faq.a2",
    },
  
    {
      questionKey: "tools.image.watermark.faq.q3",
      answerKey: "tools.image.watermark.faq.a3",
    },
    {
      questionKey: "tools.image.watermark.faq.q4",
      answerKey: "tools.image.watermark.faq.a4",
    },
    {
      questionKey: "tools.image.watermark.faq.q5",
      answerKey: "tools.image.watermark.faq.a5",
    },
  ],
  relatedSlugs: ["crop", "resize", "compress"],
};

export default definition;
