import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { hashPassword, verifyPassword } from './password';

export { hashPassword, verifyPassword };

/**
 * Minimal persistent user store (file-backed) with salted+hashed passwords
 * (scrypt). Good enough to make sign-up real in development; swap the storage
 * for a database/provider in production without touching the auth/guard layers.
 */

import type { Role } from './permissions';

export interface StoredUser {
  email: string;
  name: string;
  passwordHash: string; // format: <saltHex>:<hashHex>
  role?: Role;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'users.json');

async function readAll(): Promise<StoredUser[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as StoredUser[];
  } catch {
    return [];
  }
}

async function writeAll(users: StoredUser[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Serialize read-modify-write sections so concurrent requests can't lose updates.
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

export async function findUser(email: string): Promise<StoredUser | undefined> {
  const norm = email.trim().toLowerCase();
  return (await readAll()).find((u) => u.email === norm);
}

/** All registered users (for the admin panel). */
export async function listUsers(): Promise<StoredUser[]> {
  return (await readAll()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Set a new (hashed) password for an existing user. Returns false if unknown. */
export async function updateUserPassword(email: string, password: string): Promise<boolean> {
  const norm = email.trim().toLowerCase();
  return withLock(async () => {
    const users = await readAll();
    const user = users.find((u) => u.email === norm);
    if (!user) return false;
    user.passwordHash = hashPassword(password);
    await writeAll(users);
    return true;
  });
}

export type CreateResult = { ok: true; user: StoredUser } | { ok: false; error: 'exists' };

export async function createUser(email: string, name: string, password: string): Promise<CreateResult> {
  const norm = email.trim().toLowerCase();
  return withLock(async () => {
    const users = await readAll();
    if (users.some((u) => u.email === norm)) return { ok: false, error: 'exists' } as const;
    const user: StoredUser = {
      email: norm,
      name: name.trim() || norm.split('@')[0],
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await writeAll(users);
    return { ok: true, user } as const;
  });
}
