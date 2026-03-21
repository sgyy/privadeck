import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "compress",
  category: "image",
  icon: "ImageDown",
  featured: true,
  component: () => import("./ImageCompress"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.compress.faq.q1",
      answerKey: "tools.image.compress.faq.a1",
    },
    {
      questionKey: "tools.image.compress.faq.q2",
      answerKey: "tools.image.compress.faq.a2",
    },
  
    {
      questionKey: "tools.image.compress.faq.q3",
      answerKey: "tools.image.compress.faq.a3",
    },
    {
      questionKey: "tools.image.compress.faq.q4",
      answerKey: "tools.image.compress.faq.a4",
    },
    {
      questionKey: "tools.image.compress.faq.q5",
      answerKey: "tools.image.compress.faq.a5",
    },
  ],
  relatedSlugs: ["format-converter", "resize", "crop"],
};

export default definition;
