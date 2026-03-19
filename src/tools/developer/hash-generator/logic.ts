export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const ALL_ALGORITHMS: HashAlgorithm[] = [
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
];

export async function computeHash(
  data: ArrayBuffer,
  algorithm: HashAlgorithm
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeAllHashes(
  data: ArrayBuffer
): Promise<Record<HashAlgorithm, string>> {
  const algorithms: HashAlgorithm[] = [
    "SHA-1",
    "SHA-256",
    "SHA-384",
    "SHA-512",
  ];
  const results = await Promise.all(
    algorithms.map(
      async (algo) => [algo, await computeHash(data, algo)] as const
    )
  );
  return Object.fromEntries(results) as Record<HashAlgorithm, string>;
}
