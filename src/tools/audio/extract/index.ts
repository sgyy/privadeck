import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "extract",
  category: "audio",
  icon: "AudioLines",
  featured: true,
  component: () => import("./AudioExtract"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.audio.extract.faq.q1",
      answerKey: "tools.audio.extract.faq.a1",
    },
    {
      questionKey: "tools.audio.extract.faq.q2",
      answerKey: "tools.audio.extract.faq.a2",
    },
  
    {
      questionKey: "tools.audio.extract.faq.q3",
      answerKey: "tools.audio.extract.faq.a3",
    },
    {
      questionKey: "tools.audio.extract.faq.q4",
      answerKey: "tools.audio.extract.faq.a4",
    },
    {
      questionKey: "tools.audio.extract.faq.q5",
      answerKey: "tools.audio.extract.faq.a5",
    },
    {
      questionKey: "tools.audio.extract.faq.q6",
      answerKey: "tools.audio.extract.faq.a6",
    },
    {
      questionKey: "tools.audio.extract.faq.q7",
      answerKey: "tools.audio.extract.faq.a7",
    },
  ],
  relatedSlugs: ["trim", "convert", "volume"],
};

export default definition;
