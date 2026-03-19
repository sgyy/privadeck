export interface JsonResult {
  output: string;
  valid: boolean;
  error?: string;
}

export function formatJson(input: string, indent: number = 2): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { output: JSON.stringify(parsed, null, indent), valid: true };
  } catch (e) {
    return { output: input, valid: false, error: (e as Error).message };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { output: JSON.stringify(parsed), valid: true };
  } catch (e) {
    return { output: input, valid: false, error: (e as Error).message };
  }
}

export function validateJson(input: string): JsonResult {
  try {
    JSON.parse(input);
    return { output: input, valid: true };
  } catch (e) {
    return { output: input, valid: false, error: (e as Error).message };
  }
}
