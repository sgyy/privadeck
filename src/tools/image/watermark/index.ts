import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "watermark",
  category: "image",
  icon: "Stamp",
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
      questionKey: "tools.image.watermark.faq.q6",
      answerKey: "tools.image.watermark.faq.a6",
    },
    {
      questionKey: "tools.image.watermark.faq.q7",
      answerKey: "tools.image.watermark.faq.a7",
    },
    {
      questionKey: "common.sharedFaq.q3",
      answerKey: "common.sharedFaq.a3",
    },
    {
      questionKey: "common.sharedFaq.q4",
      answerKey: "common.sharedFaq.a4",
    },
    {
      questionKey: "tools.image.watermark.faq.q5",
      answerKey: "tools.image.watermark.faq.a5",
    },
  ],
  relatedSlugs: ["add-text", "crop", "compress"],
};

export default definition;
