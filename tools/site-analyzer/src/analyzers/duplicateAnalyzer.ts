import type { Page } from '../schemas/page.schema';
import type { DuplicateGroup } from '../schemas/site.schema';
import { hammingDistance } from '../utils/hash';

/**
 * Detect exact/near-duplicate pages, parameter variants, alternate-canonical
 * clusters, empty pages and likely soft-404s.
 */
export function analyzeDuplicates(pages: Page[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];

  // Exact structural duplicates (identical structureHash).
  const byStructure = new Map<string, Page[]>();
  for (const p of pages) {
    const arr = byStructure.get(p.structureHash) ?? [];
    arr.push(p);
    byStructure.set(p.structureHash, arr);
  }
  for (const [fp, group] of byStructure) {
    if (group.length > 1) {
      groups.push({
        kind: 'exact',
        fingerprint: fp,
        urls: group.map((g) => g.normalizedUrl),
        note: 'Identical heading/text structure fingerprint.',
      });
    }
  }

  // Near-duplicates via SimHash Hamming distance (<= 4 bits over 64).
  const flagged = new Set<string>();
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const a = pages[i];
      const b = pages[j];
      if (a.structureHash === b.structureHash) continue; // already exact
      const key = a.normalizedUrl + '|' + b.normalizedUrl;
      if (flagged.has(key)) continue;
      const dist = hammingDistance(a.textSimHash, b.textSimHash);
      if (dist <= 4) {
        flagged.add(key);
        groups.push({
          kind: 'near',
          fingerprint: `${a.textSimHash}~${b.textSimHash}`,
          urls: [a.normalizedUrl, b.normalizedUrl],
          note: `Near-duplicate main text (Hamming distance ${dist}).`,
        });
      }
    }
  }

  // Alternate-canonical: pages whose canonical points elsewhere.
  for (const p of pages) {
    if (p.canonicalUrl && p.canonicalUrl.replace(/\/$/, '') !== p.normalizedUrl.replace(/\/$/, '')) {
      groups.push({
        kind: 'alternate-canonical',
        fingerprint: p.structureHash,
        urls: [p.normalizedUrl, p.canonicalUrl],
        note: 'Page declares a different canonical URL.',
      });
    }
  }

  // Empty & soft-404 pages.
  for (const p of pages) {
    if (p.wordCount < 30) {
      groups.push({ kind: 'empty', fingerprint: p.structureHash, urls: [p.normalizedUrl], note: `Very low content (${p.wordCount} words).` });
    } else if (p.statusCode === 200 && /(404|not found|page.+(doesn.?t|does not) exist|no longer available)/i.test((p.title ?? '') + ' ' + p.contentSummary)) {
      groups.push({ kind: 'soft-404', fingerprint: p.structureHash, urls: [p.normalizedUrl], note: 'HTTP 200 but content reads as "not found".' });
    }
  }

  return groups;
}
