import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "compress",
  category: "video",
  icon: "FileDown",
  featured: true,
  component: () => import("./VideoCompress"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.compress.faq.q1",
      answerKey: "tools.video.compress.faq.a1",
    },
    {
      questionKey: "tools.video.compress.faq.q2",
      answerKey: "tools.video.compress.faq.a2",
    },
  
    {
      questionKey: "tools.video.compress.faq.q3",
      answerKey: "tools.video.compress.faq.a3",
    },
    {
      questionKey: "tools.video.compress.faq.q4",
      answerKey: "tools.video.compress.faq.a4",
    },
    {
      questionKey: "tools.video.compress.faq.q5",
      answerKey: "tools.video.compress.faq.a5",
    },
  ],
  relatedSlugs: ["trim", "format-convert", "mute"],
};

export default definition;
