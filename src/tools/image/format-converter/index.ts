import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "format-converter",
  category: "image",
  icon: "FileOutput",
  featured: true,
  component: () => import("./FormatConverter"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.format-converter.faq.q1",
      answerKey: "tools.image.format-converter.faq.a1",
    },
    {
      questionKey: "tools.image.format-converter.faq.q2",
      answerKey: "tools.image.format-converter.faq.a2",
    },
    {
      questionKey: "tools.image.format-converter.faq.q3",
      answerKey: "tools.image.format-converter.faq.a3",
    },
  ],
  relatedSlugs: ["compress", "resize", "crop"],
};

export default definition;
