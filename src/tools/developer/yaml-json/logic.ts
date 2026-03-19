import yaml from "js-yaml";

export function yamlToJson(yamlStr: string): string {
  const data = yaml.load(yamlStr);
  return JSON.stringify(data, null, 2);
}

export function jsonToYaml(jsonStr: string): string {
  const data = JSON.parse(jsonStr);
  return yaml.dump(data, { indent: 2, lineWidth: -1 });
}
