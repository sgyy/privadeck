import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "volume",
  category: "audio",
  icon: "Volume2",
  featured: true,
  component: () => import("./AudioVolume"),
  seo: {
    structuredDataType: "WebApplication",
  },
  faq: [
    {
      questionKey: "tools.audio.volume.faq.q1",
      answerKey: "tools.audio.volume.faq.a1",
    },
    {
      questionKey: "tools.audio.volume.faq.q2",
      answerKey: "tools.audio.volume.faq.a2",
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
      questionKey: "tools.audio.volume.faq.q5",
      answerKey: "tools.audio.volume.faq.a5",
    },
  ],
  relatedSlugs: ["trim", "convert", "extract"],
};

export default definition;
