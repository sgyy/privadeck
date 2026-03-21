import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "trim",
  category: "audio",
  icon: "Music",
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
      questionKey: "tools.audio.trim.faq.q3",
      answerKey: "tools.audio.trim.faq.a3",
    },
    {
      questionKey: "tools.audio.trim.faq.q4",
      answerKey: "tools.audio.trim.faq.a4",
    },
    {
      questionKey: "tools.audio.trim.faq.q5",
      answerKey: "tools.audio.trim.faq.a5",
    },
  ],
  relatedSlugs: ["convert", "extract"],
};

export default definition;
