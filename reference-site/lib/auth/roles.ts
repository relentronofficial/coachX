import type { Role } from './permissions';

/**
 * Super-admin resolution. In production set ADMIN_EMAILS (comma-separated). In
 * dev, if it is unset, any address starting with "admin@" is treated as a
 * super-admin so the panel is testable without extra config.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  const list = adminEmails();
  if (list.length) return list.includes(e);
  return e.startsWith('admin@'); // dev fallback
}

/** Synchronous best-effort role (env super-admins + stored role). */
export function resolveRole(email: string, stored?: Role): Role {
  if (isAdminEmail(email)) return 'super-admin';
  return stored ?? 'user';
}
