import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "to-gif",
  category: "video",
  icon: "Video",
  featured: true,
  component: () => import("./VideoToGif"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.to-gif.faq.q1",
      answerKey: "tools.video.to-gif.faq.a1",
    },
    {
      questionKey: "tools.video.to-gif.faq.q2",
      answerKey: "tools.video.to-gif.faq.a2",
    },
  
    {
      questionKey: "tools.video.to-gif.faq.q3",
      answerKey: "tools.video.to-gif.faq.a3",
    },
    {
      questionKey: "tools.video.to-gif.faq.q4",
      answerKey: "tools.video.to-gif.faq.a4",
    },
    {
      questionKey: "tools.video.to-gif.faq.q5",
      answerKey: "tools.video.to-gif.faq.a5",
    },
  ],
  relatedSlugs: ["to-webp", "trim", "mute"],
};

export default definition;
