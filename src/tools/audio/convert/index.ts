import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "convert",
  category: "audio",
  icon: "FileAudio",
  featured: true,
  component: () => import("./AudioConvert"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.audio.convert.faq.q1",
      answerKey: "tools.audio.convert.faq.a1",
    },
    {
      questionKey: "tools.audio.convert.faq.q2",
      answerKey: "tools.audio.convert.faq.a2",
    },
  
    {
      questionKey: "tools.audio.convert.faq.q3",
      answerKey: "tools.audio.convert.faq.a3",
    },
    {
      questionKey: "tools.audio.convert.faq.q4",
      answerKey: "tools.audio.convert.faq.a4",
    },
    {
      questionKey: "tools.audio.convert.faq.q5",
      answerKey: "tools.audio.convert.faq.a5",
    },
  ],
  relatedSlugs: ["trim", "extract"],
};

export default definition;
