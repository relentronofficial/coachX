/**
 * Text sanitisation helpers.
 *
 * Two responsibilities:
 *  1. Keep stored excerpts SHORT (copyright-safe) — never persist long bodies.
 *  2. Strip anything that looks like a secret / token / PII so it never lands
 *     in the dataset, even if the crawler stumbles onto it.
 */

const MAX_EXCERPT_CHARS = Number(process.env.MAX_EXCERPT_CHARS ?? 300);

/** Collapse whitespace to single spaces and trim. */
export function collapseWhitespace(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Truncate to a hard character cap, cutting on a word boundary where possible
 * and appending an ellipsis. Default cap is copyright-safe (300 chars).
 */
export function excerpt(text: string | null | undefined, max = MAX_EXCERPT_CHARS): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…';
}

// Patterns that indicate secrets / sensitive values we must never store.
const SECRET_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9_-]*(?:api[_-]?key|secret|token|password|passwd|bearer|authorization)[A-Za-z0-9_-]*\b\s*[:=]\s*\S+/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWT
  /\bsk-[A-Za-z0-9]{20,}\b/g, // common secret-key prefix
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
];

// Rough PII patterns — redacted from any stored text.
const PII_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // email
  /\b(?:\+?\d[\d\s().-]{8,}\d)\b/g, // phone-like sequences
];

/** Redact secrets from arbitrary text. */
export function redactSecrets(text: string): string {
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[REDACTED_SECRET]');
  return out;
}

/** Redact PII (email/phone) — used on free text, NOT on structural labels. */
export function redactPII(text: string): string {
  let out = text;
  out = out.replace(PII_PATTERNS[0], '[REDACTED_EMAIL]');
  out = out.replace(PII_PATTERNS[1], '[REDACTED_PHONE]');
  return out;
}

/** Full clean: collapse → redact secrets → redact PII → excerpt. */
export function safeExcerpt(text: string | null | undefined, max = MAX_EXCERPT_CHARS): string {
  return excerpt(redactPII(redactSecrets(collapseWhitespace(text))), max);
}

/** Filesystem-safe slug for filenames derived from a route path. */
export function slugifyPath(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return 'home';
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\//g, '__')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}
