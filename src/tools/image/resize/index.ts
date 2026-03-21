import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "resize",
  category: "image",
  icon: "Scaling",
  featured: true,
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
  
    {
      questionKey: "tools.image.resize.faq.q3",
      answerKey: "tools.image.resize.faq.a3",
    },
    {
      questionKey: "tools.image.resize.faq.q4",
      answerKey: "tools.image.resize.faq.a4",
    },
    {
      questionKey: "tools.image.resize.faq.q5",
      answerKey: "tools.image.resize.faq.a5",
    },
  ],
  relatedSlugs: ["crop", "compress", "format-converter"],
};

export default definition;
