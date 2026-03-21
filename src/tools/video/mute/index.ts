import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "mute",
  category: "video",
  icon: "Video",
  featured: true,
  component: () => import("./VideoMute"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.mute.faq.q1",
      answerKey: "tools.video.mute.faq.a1",
    },
    {
      questionKey: "tools.video.mute.faq.q2",
      answerKey: "tools.video.mute.faq.a2",
    },
  
    {
      questionKey: "tools.video.mute.faq.q3",
      answerKey: "tools.video.mute.faq.a3",
    },
    {
      questionKey: "tools.video.mute.faq.q4",
      answerKey: "tools.video.mute.faq.a4",
    },
    {
      questionKey: "tools.video.mute.faq.q5",
      answerKey: "tools.video.mute.faq.a5",
    },
  ],
  relatedSlugs: ["trim", "rotate", "to-gif"],
};

export default definition;
