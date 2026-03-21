import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "rotate",
  category: "video",
  icon: "Video",
  featured: false,
  component: () => import("./VideoRotate"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.rotate.faq.q1",
      answerKey: "tools.video.rotate.faq.a1",
    },
    {
      questionKey: "tools.video.rotate.faq.q2",
      answerKey: "tools.video.rotate.faq.a2",
    },
  
    {
      questionKey: "tools.video.rotate.faq.q3",
      answerKey: "tools.video.rotate.faq.a3",
    },
    {
      questionKey: "tools.video.rotate.faq.q4",
      answerKey: "tools.video.rotate.faq.a4",
    },
    {
      questionKey: "tools.video.rotate.faq.q5",
      answerKey: "tools.video.rotate.faq.a5",
    },
  ],
  relatedSlugs: ["mute", "trim", "to-gif"],
};

export default definition;
