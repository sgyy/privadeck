import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "csv-json",
  category: "developer",
  icon: "Table",
  featured: false,
  component: () => import("./CsvJsonTool"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.csv-json.faq.q1",
      answerKey: "tools.developer.csv-json.faq.a1",
    },
    {
      questionKey: "tools.developer.csv-json.faq.q2",
      answerKey: "tools.developer.csv-json.faq.a2",
    },
  ],
  relatedSlugs: ["json-formatter", "base64", "url-encoder"],
};

export default definition;
