import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "yaml-json",
  category: "developer",
  icon: "FileCode2",
  featured: false,
  component: () => import("./YamlJson"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.yaml-json.faq.q1",
      answerKey: "tools.developer.yaml-json.faq.a1",
    },
    {
      questionKey: "tools.developer.yaml-json.faq.q2",
      answerKey: "tools.developer.yaml-json.faq.a2",
    },
  ],
  relatedSlugs: ["json-formatter", "json-xml", "csv-json"],
};

export default definition;
