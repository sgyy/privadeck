import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "trim",
  category: "audio",
  icon: "Scissors",
  featured: true,
  component: () => import("./AudioTrim"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.audio.trim.faq.q1",
      answerKey: "tools.audio.trim.faq.a1",
    },
    {
      questionKey: "tools.audio.trim.faq.q2",
      answerKey: "tools.audio.trim.faq.a2",
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
      questionKey: "tools.audio.trim.faq.q5",
      answerKey: "tools.audio.trim.faq.a5",
    },
    {
      questionKey: "tools.audio.trim.faq.q6",
      answerKey: "tools.audio.trim.faq.a6",
    },
    {
      questionKey: "tools.audio.trim.faq.q7",
      answerKey: "tools.audio.trim.faq.a7",
    },
  ],
  relatedSlugs: ["convert", "extract", "volume"],
};

export default definition;
