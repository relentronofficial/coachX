import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Password-reset token store (file-backed). We store only a SHA-256 hash of the
 * token + an expiry, never the raw token — the raw token lives only in the reset
 * link. In dev the link is returned by the request endpoint (no email service);
 * in production, email the link instead and remove that response field.
 */

interface ResetRecord {
  email: string;
  tokenHash: string;
  expiresAt: number; // epoch ms
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'reset-tokens.json');
const TTL_MS = 1000 * 60 * 30; // 30 minutes

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

async function readAll(): Promise<ResetRecord[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as ResetRecord[];
  } catch {
    return [];
  }
}

async function writeAll(records: ResetRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2), 'utf8');
}

// Serialize read-modify-write sections against concurrent requests.
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

/** Create a reset token for an email. Returns the RAW token (put it in the link). */
export async function createResetToken(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const token = randomBytes(32).toString('hex');
  await withLock(async () => {
    const now = Date.now();
    const records = (await readAll())
      .filter((r) => r.expiresAt > now) // prune expired
      .filter((r) => r.email !== norm); // one active token per email
    records.push({ email: norm, tokenHash: hashToken(token), expiresAt: now + TTL_MS });
    await writeAll(records);
  });
  return token;
}

/** Validate a raw token → the email it belongs to, or null. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const hash = hashToken(token);
  return withLock(async () => {
    const now = Date.now();
    const records = await readAll();
    const match = records.find((r) => r.tokenHash === hash && r.expiresAt > now);
    if (!match) return null;
    // Single-use: remove it (and any expired ones) after a successful consume.
    await writeAll(records.filter((r) => r.tokenHash !== hash && r.expiresAt > now));
    return match.email;
  });
}

/** Peek validity without consuming (for the reset page to show a friendly state). */
export async function isResetTokenValid(token: string): Promise<boolean> {
  const now = Date.now();
  const hash = hashToken(token);
  return (await readAll()).some((r) => r.tokenHash === hash && r.expiresAt > now);
}
