import { sha3_256, sha3_512 } from "js-sha3";
import { computeMD5 } from "./md5";
import { computeCRC32 } from "./crc32";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HashAlgorithm =
  | "MD5"
  | "SHA-1"
  | "SHA-256"
  | "SHA-384"
  | "SHA-512"
  | "SHA3-256"
  | "SHA3-512"
  | "CRC32";

export type OutputFormat = "hex-lower" | "hex-upper" | "base64";

export const ALL_ALGORITHMS: HashAlgorithm[] = [
  "MD5",
  "CRC32",
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA3-256",
  "SHA3-512",
];

// Algorithms supported by Web Crypto HMAC
const HMAC_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HmacAlgorithm = (typeof HMAC_ALGORITHMS)[number];
export const ALL_HMAC_ALGORITHMS: HmacAlgorithm[] = [...HMAC_ALGORITHMS];

// ---------------------------------------------------------------------------
// Core hashing
// ---------------------------------------------------------------------------

async function computeHashBuffer(
  data: ArrayBuffer,
  algorithm: HashAlgorithm
): Promise<ArrayBuffer> {
  switch (algorithm) {
    case "MD5":
      return computeMD5(data);
    case "CRC32":
      return computeCRC32(data);
    case "SHA3-256": {
      const hex = sha3_256(new Uint8Array(data));
      return hexToBuffer(hex);
    }
    case "SHA3-512": {
      const hex = sha3_512(new Uint8Array(data));
      return hexToBuffer(hex);
    }
    default:
      // SHA-1, SHA-256, SHA-384, SHA-512 via Web Crypto
      return crypto.subtle.digest(algorithm, data);
  }
}

export async function computeAllHashes(
  data: ArrayBuffer
): Promise<Record<HashAlgorithm, ArrayBuffer>> {
  const results = await Promise.all(
    ALL_ALGORITHMS.map(
      async (algo) => [algo, await computeHashBuffer(data, algo)] as const
    )
  );
  return Object.fromEntries(results) as Record<HashAlgorithm, ArrayBuffer>;
}

// ---------------------------------------------------------------------------
// HMAC
// ---------------------------------------------------------------------------

export async function computeHMAC(
  data: ArrayBuffer,
  keyBytes: ArrayBuffer,
  algorithm: HmacAlgorithm
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, data);
}

export async function computeAllHMAC(
  data: ArrayBuffer,
  keyBytes: ArrayBuffer
): Promise<Record<HmacAlgorithm, ArrayBuffer>> {
  const results = await Promise.all(
    ALL_HMAC_ALGORITHMS.map(
      async (algo) =>
        [algo, await computeHMAC(data, keyBytes, algo)] as const
    )
  );
  return Object.fromEntries(results) as Record<HmacAlgorithm, ArrayBuffer>;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatHash(buffer: ArrayBuffer, format: OutputFormat): string {
  const bytes = new Uint8Array(buffer);
  switch (format) {
    case "hex-lower":
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    case "hex-upper":
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join("");
    case "base64": {
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export function verifyHash(
  expected: string,
  results: Record<string, string>
): { match: boolean; algorithm: string | null } {
  const normalized = expected.trim().toLowerCase();
  if (!normalized) return { match: false, algorithm: null };
  for (const [algo, hash] of Object.entries(results)) {
    if (hash.toLowerCase() === normalized) {
      return { match: true, algorithm: algo };
    }
  }
  return { match: false, algorithm: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export function parseHexKey(hex: string): ArrayBuffer {
  const clean = hex.replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Invalid hex key");
  }
  return hexToBuffer(clean);
}
