export type Base64Variant = "standard" | "url-safe";

export type Base64Result =
  | { ok: true; output: string }
  | { ok: false; error: string };

export type Base64BytesResult =
  | { ok: true; output: Uint8Array }
  | { ok: false; error: string };

// --- Core text encode/decode ---

function toStandardBase64(input: string): string {
  return btoa(
    encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}

function fromStandardBase64(b64: string): string {
  return decodeURIComponent(
    Array.from(atob(b64))
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
}

function standardToUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlSafeToStandard(b64: string): string {
  let s = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  return s;
}

export function encodeBase64(
  input: string,
  variant: Base64Variant = "standard",
): Base64Result {
  try {
    let result = toStandardBase64(input);
    if (variant === "url-safe") result = standardToUrlSafe(result);
    return { ok: true, output: result };
  } catch {
    return { ok: false, error: "encodeFailed" };
  }
}

export function decodeBase64(
  input: string,
  variant: Base64Variant = "standard",
): Base64Result {
  try {
    let b64 = input.trim();
    if (variant === "url-safe") b64 = urlSafeToStandard(b64);
    return { ok: true, output: fromStandardBase64(b64) };
  } catch {
    return { ok: false, error: "invalidBase64" };
  }
}

// --- File encode/decode ---

export function encodeFileToBase64(
  buffer: ArrayBuffer,
  variant: Base64Variant = "standard",
): string {
  const bytes = new Uint8Array(buffer);
  // Build binary string in 32KB chunks to avoid call stack overflow
  const chunks: string[] = [];
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...slice));
  }
  let result = btoa(chunks.join(""));
  if (variant === "url-safe") result = standardToUrlSafe(result);
  return result;
}

export function decodeBase64ToBytes(
  input: string,
  variant: Base64Variant = "standard",
): Base64BytesResult {
  try {
    let b64 = input.trim();
    // Strip data URI prefix if present
    const parsed = parseDataUri(b64);
    if (parsed) b64 = parsed.base64;
    if (variant === "url-safe") b64 = urlSafeToStandard(b64);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { ok: true, output: bytes };
  } catch {
    return { ok: false, error: "invalidBase64" };
  }
}

// --- Auto-detect ---

export function isLikelyBase64(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 8) return false;
  // Allow data URI prefix
  const parsed = parseDataUri(trimmed);
  const b64 = parsed ? parsed.base64 : trimmed;
  if (!/^[A-Za-z0-9+/\-_\s]*={0,2}$/.test(b64)) return false;
  const noPad = b64.replace(/[\s=]/g, "");
  if (noPad.length % 4 === 1) return false;
  // Trial decode
  try {
    const std = urlSafeToStandard(b64.replace(/\s/g, ""));
    atob(std);
    return true;
  } catch {
    return false;
  }
}

// --- Image detection via magic bytes ---

export function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  // WebP (RIFF....WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  // BMP
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }
  return null;
}

// --- Data URI ---

export function formatDataUri(base64: string, mime: string): string {
  return `data:${mime};base64,${base64}`;
}

export function parseDataUri(
  input: string,
): { mime: string; base64: string } | null {
  const match = input.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

// --- Normalize to standard base64 (for data URI) ---

export function normalizeToStandard(input: string, variant: Base64Variant): string {
  let b64 = input.trim();
  const parsed = parseDataUri(b64);
  if (parsed) b64 = parsed.base64;
  if (variant === "url-safe") b64 = urlSafeToStandard(b64);
  return b64;
}

// --- Utilities ---

export function formatByteSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function guessMimeFromName(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    zip: "application/zip",
    json: "application/json",
    xml: "application/xml",
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    webm: "video/webm",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };
  return map[ext] ?? "application/octet-stream";
}
