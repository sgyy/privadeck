import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "compress",
  category: "image",
  icon: "Image",
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
  ],
  relatedSlugs: ["format-converter", "resize", "crop"],
};

export default definition;
