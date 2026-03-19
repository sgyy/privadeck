import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "markdown-preview",
  category: "developer",
  icon: "BookOpen",
  featured: false,
  component: () => import("./MarkdownPreview"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.markdown-preview.faq.q1",
      answerKey: "tools.developer.markdown-preview.faq.a1",
    },
    {
      questionKey: "tools.developer.markdown-preview.faq.q2",
      answerKey: "tools.developer.markdown-preview.faq.a2",
    },
  ],
  relatedSlugs: ["json-formatter", "csv-json", "base64"],
};

export default definition;
