import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "format-convert",
  category: "video",
  icon: "FileVideo",
  featured: false,
  component: () => import("./VideoFormatConvert"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.format-convert.faq.q1",
      answerKey: "tools.video.format-convert.faq.a1",
    },
    {
      questionKey: "tools.video.format-convert.faq.q2",
      answerKey: "tools.video.format-convert.faq.a2",
    },
  
    {
      questionKey: "tools.video.format-convert.faq.q3",
      answerKey: "tools.video.format-convert.faq.a3",
    },
    {
      questionKey: "tools.video.format-convert.faq.q4",
      answerKey: "tools.video.format-convert.faq.a4",
    },
    {
      questionKey: "tools.video.format-convert.faq.q5",
      answerKey: "tools.video.format-convert.faq.a5",
    },
  ],
  relatedSlugs: ["compress", "trim", "to-gif"],
};

export default definition;
