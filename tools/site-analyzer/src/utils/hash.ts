import { createHash } from 'node:crypto';

/** Deterministic short hex hash (first 16 chars of sha256) for storage keys. */
export function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/** Full sha256 hex digest — used for exact content/media de-duplication. */
export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Cheap, order-insensitive "structural" fingerprint of a token list.
 * Used to compare heading structures / text shingles for near-duplicate pages.
 */
export function structuralFingerprint(tokens: string[]): string {
  const normalized = tokens
    .map((t) => t.toLowerCase().replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .sort();
  return sha256(normalized.join(''));
}

/**
 * A tiny 64-bit SimHash over word shingles, returned as a hex string.
 * Enables Hamming-distance near-duplicate detection without heavy deps.
 */
export function simHash(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const bits = new Array<number>(64).fill(0);
  for (const w of words) {
    const h = BigInt('0x' + sha256(w).slice(0, 16));
    for (let i = 0; i < 64; i++) {
      const bit = (h >> BigInt(i)) & 1n;
      bits[i] += bit === 1n ? 1 : -1;
    }
  }
  let out = 0n;
  for (let i = 0; i < 64; i++) {
    if (bits[i] > 0) out |= 1n << BigInt(i);
  }
  return out.toString(16).padStart(16, '0');
}

/** Hamming distance between two equal-length hex SimHash strings. */
export function hammingDistance(a: string, b: string): number {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}
