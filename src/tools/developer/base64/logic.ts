export function encodeBase64(input: string): string {
  try {
    return btoa(
      encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );
  } catch {
    return "Error: Unable to encode";
  }
}

export function decodeBase64(input: string): string {
  try {
    return decodeURIComponent(
      Array.from(atob(input.trim()))
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
  } catch {
    return "Error: Invalid Base64 string";
  }
}
