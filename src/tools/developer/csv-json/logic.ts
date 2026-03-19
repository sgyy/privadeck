export function csvToJson(csv: string): string {
  const lines = parseCsvLines(csv);
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = lines[0];
  const result = lines
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = row[i] ?? "";
      });
      return obj;
    });

  return JSON.stringify(result, null, 2);
}

export function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  if (!Array.isArray(data) || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map(escapeCsvField).join(","),
    ...data.map((row: Record<string, unknown>) =>
      headers.map((h) => escapeCsvField(String(row[h] ?? ""))).join(",")
    ),
  ];

  return csvRows.join("\n");
}

function parseCsvLines(csv: string): string[][] {
  const results: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        current.push(field);
        field = "";
        results.push(current);
        current = [];
        if (ch === "\r" && csv[i + 1] === "\n") i++; // consume \n of \r\n
      } else {
        field += ch;
      }
    }
  }
  if (field || current.length > 0) {
    current.push(field);
    results.push(current);
  }
  return results;
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}
