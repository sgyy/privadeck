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
  
    {
      questionKey: "tools.developer.csv-json.faq.q3",
      answerKey: "tools.developer.csv-json.faq.a3",
    },
    {
      questionKey: "tools.developer.csv-json.faq.q4",
      answerKey: "tools.developer.csv-json.faq.a4",
    },
    {
      questionKey: "tools.developer.csv-json.faq.q5",
      answerKey: "tools.developer.csv-json.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "base64", "url-encoder"],
};

export default definition;
