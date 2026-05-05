import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "trim",
  category: "video",
  icon: "Scissors",
  featured: true,
  component: () => import("./VideoTrim"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.trim.faq.q1",
      answerKey: "tools.video.trim.faq.a1",
    },
    {
      questionKey: "tools.video.trim.faq.q2",
      answerKey: "tools.video.trim.faq.a2",
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
      questionKey: "tools.video.trim.faq.q5",
      answerKey: "tools.video.trim.faq.a5",
    },
  ],
  relatedSlugs: ["mute", "rotate", "to-gif"],
};

export default definition;
