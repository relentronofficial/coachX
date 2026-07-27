import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Append-only audit log of admin actions. */
export interface AuditEntry {
  id: string;
  actor: string; // admin email
  action: string; // e.g. "submission.status", "submission.delete"
  target: string | null; // affected id
  meta: Record<string, unknown>;
  at: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'audit.json');

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<AuditEntry[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as AuditEntry[];
  } catch {
    return [];
  }
}

export async function audit(actor: string, action: string, target: string | null, meta: Record<string, unknown> = {}): Promise<void> {
  const entry: AuditEntry = { id: randomUUID(), actor, action, target, meta, at: new Date().toISOString() };
  await withLock(async () => {
    const rows = await readAll();
    rows.push(entry);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(rows.slice(-2000), null, 2), 'utf8'); // cap size
  });
}

export async function listAudit(page = 1, pageSize = 50): Promise<{ rows: AuditEntry[]; total: number }> {
  const rows = (await readAll()).sort((a, b) => (a.at < b.at ? 1 : -1));
  const start = (Math.max(1, page) - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length };
}
