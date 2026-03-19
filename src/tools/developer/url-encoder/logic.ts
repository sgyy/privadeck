export function encodeUrl(input: string): string {
  try {
    return encodeURI(input);
  } catch {
    return "Error: Unable to encode";
  }
}

export function decodeUrl(input: string): string {
  try {
    return decodeURI(input);
  } catch {
    return "Error: Invalid encoded URL";
  }
}

export function encodeUrlComponent(input: string): string {
  try {
    return encodeURIComponent(input);
  } catch {
    return "Error: Unable to encode";
  }
}

export function decodeUrlComponent(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return "Error: Invalid encoded string";
  }
}
