import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "flip",
  category: "image",
  icon: "FlipHorizontal2",
  featured: false,
  component: () => import("./Flip"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.flip.faq.q1",
      answerKey: "tools.image.flip.faq.a1",
    },
    {
      questionKey: "tools.image.flip.faq.q2",
      answerKey: "tools.image.flip.faq.a2",
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
      questionKey: "tools.image.flip.faq.q5",
      answerKey: "tools.image.flip.faq.a5",
    },
    {
      questionKey: "tools.image.flip.faq.q6",
      answerKey: "tools.image.flip.faq.a6",
    },
  ],
  relatedSlugs: ["crop", "resize", "watermark"],
};

export default definition;
