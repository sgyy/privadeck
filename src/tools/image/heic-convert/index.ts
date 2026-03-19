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
  ],
  relatedSlugs: ["format-converter", "compress", "remove-exif"],
};

export default definition;
