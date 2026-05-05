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
      questionKey: "common.sharedFaq.q3",
      answerKey: "common.sharedFaq.a3",
    },
    {
      questionKey: "common.sharedFaq.q4",
      answerKey: "common.sharedFaq.a4",
    },
    {
      questionKey: "tools.audio.convert.faq.q5",
      answerKey: "tools.audio.convert.faq.a5",
    },
    {
      questionKey: "tools.audio.convert.faq.q6",
      answerKey: "tools.audio.convert.faq.a6",
    },
    {
      questionKey: "tools.audio.convert.faq.q7",
      answerKey: "tools.audio.convert.faq.a7",
    },
  ],
  relatedSlugs: ["trim", "extract", "volume"],
};

export default definition;
