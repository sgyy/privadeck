import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "resize",
  category: "image",
  icon: "Image",
  featured: false,
  component: () => import("./ImageResize"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.resize.faq.q1",
      answerKey: "tools.image.resize.faq.a1",
    },
    {
      questionKey: "tools.image.resize.faq.q2",
      answerKey: "tools.image.resize.faq.a2",
    },
  ],
  relatedSlugs: ["crop", "compress", "format-converter"],
};

export default definition;
