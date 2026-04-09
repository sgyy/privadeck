/**
 * Pure JavaScript CRC32 implementation.
 * Returns a 4-byte ArrayBuffer containing the CRC32 value.
 */

// Pre-computed CRC32 lookup table
const TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  TABLE[i] = crc >>> 0;
}

export function computeCRC32(data: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(data);
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xffffffff) >>> 0;

  const result = new ArrayBuffer(4);
  new DataView(result).setUint32(0, crc, false); // big-endian for display
  return result;
}
