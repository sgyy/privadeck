import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "heic-convert",
  category: "image",
  icon: "FileImage",
  featured: false,
  component: () => import("./HeicConvert"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.heic-convert.faq.q1",
      answerKey: "tools.image.heic-convert.faq.a1",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q2",
      answerKey: "tools.image.heic-convert.faq.a2",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q3",
      answerKey: "tools.image.heic-convert.faq.a3",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q4",
      answerKey: "tools.image.heic-convert.faq.a4",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q5",
      answerKey: "tools.image.heic-convert.faq.a5",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q6",
      answerKey: "tools.image.heic-convert.faq.a6",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q7",
      answerKey: "tools.image.heic-convert.faq.a7",
    },
    {
      questionKey: "tools.image.heic-convert.faq.q8",
      answerKey: "tools.image.heic-convert.faq.a8",
    },
  ],
  relatedSlugs: ["format-converter", "compress", "remove-exif", "flip"],
};

export default definition;
