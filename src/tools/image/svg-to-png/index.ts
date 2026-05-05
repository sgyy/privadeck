import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "svg-to-png",
  category: "image",
  icon: "FileImage",
  featured: false,
  component: () => import("./SvgToPng"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.svg-to-png.faq.q1",
      answerKey: "tools.image.svg-to-png.faq.a1",
    },
    {
      questionKey: "tools.image.svg-to-png.faq.q2",
      answerKey: "tools.image.svg-to-png.faq.a2",
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
      questionKey: "tools.image.svg-to-png.faq.q5",
      answerKey: "tools.image.svg-to-png.faq.a5",
    },
  ],
  relatedSlugs: ["format-converter", "resize", "compress"],
};

export default definition;
