import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseUserAgent } from './userAgent';

/**
 * Unified submission store — every public form writes here via recordSubmission.
 * A form "registers itself" simply by being the first submission with a given
 * formKey, so the Admin panel lists forms dynamically with no per-form code.
 */

export type SubmissionStatus = 'new' | 'contacted' | 'qualified' | 'converted';

export interface Submission {
  id: string;
  formKey: string;
  formLabel: string;
  uid: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, unknown>;
  status: SubmissionStatus;
  archived: boolean;
  sourceUrl: string | null;
  ip: string | null;
  userAgent: string | null;
  device: string;
  browser: string;
  os: string;
  notes: string;
  assignedTo: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'submissions.json');

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<Submission[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Submission[];
  } catch {
    return [];
  }
}
async function writeAll(rows: Submission[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), 'utf8');
}

function clientIp(req?: Request): string | null {
  if (!req) return null;
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

function titleCase(key: string): string {
  return key
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export interface RecordInput {
  formKey: string;
  formLabel?: string;
  uid?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  answers?: Record<string, unknown>;
  sourceUrl?: string | null;
  /** Pass the Request to auto-capture IP + user-agent. */
  request?: Request;
  ip?: string | null;
  userAgent?: string | null;
}

/** Append a submission (auto-registers the form). Never throws on store errors. */
export async function recordSubmission(input: RecordInput): Promise<Submission> {
  const ua = input.userAgent ?? input.request?.headers.get('user-agent') ?? null;
  const parsed = parseUserAgent(ua);
  const now = new Date().toISOString();
  const sub: Submission = {
    id: randomUUID(),
    formKey: input.formKey.trim().toLowerCase(),
    formLabel: input.formLabel?.trim() || titleCase(input.formKey),
    uid: input.uid ?? null,
    name: input.name ?? null,
    email: input.email ? input.email.trim().toLowerCase() : null,
    phone: input.phone ?? null,
    answers: input.answers ?? {},
    status: 'new',
    archived: false,
    sourceUrl: input.sourceUrl ?? null,
    ip: input.ip ?? clientIp(input.request),
    userAgent: ua,
    device: parsed.device,
    browser: parsed.browser,
    os: parsed.os,
    notes: '',
    assignedTo: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  await withLock(async () => {
    const rows = await readAll();
    rows.push(sub);
    await writeAll(rows);
  });
  return sub;
}

// ---- Queries -------------------------------------------------------------

export interface ListQuery {
  formKey?: string;
  formKeys?: string[];
  q?: string;
  status?: SubmissionStatus;
  archived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListResult {
  rows: Submission[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export async function listSubmissions(query: ListQuery = {}): Promise<ListResult> {
  const all = await readAll();
  const q = (query.q ?? '').trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

  let rows = all.filter((r) => {
    if (query.formKey && r.formKey !== query.formKey) return false;
    if (query.formKeys && !query.formKeys.includes(r.formKey)) return false;
    if (query.status && r.status !== query.status) return false;
    if (query.archived !== undefined && r.archived !== query.archived) return false;
    if (q) {
      const hay = `${r.name ?? ''} ${r.email ?? ''} ${r.phone ?? ''} ${r.formKey} ${r.tags.join(' ')} ${JSON.stringify(r.answers)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total, page, pageSize, pages };
}

export async function getSubmission(id: string): Promise<Submission | null> {
  return (await readAll()).find((r) => r.id === id) ?? null;
}

export type SubmissionPatch = Partial<
  Pick<Submission, 'status' | 'archived' | 'notes' | 'assignedTo' | 'tags' | 'name' | 'email' | 'phone'>
>;

export async function updateSubmission(id: string, patch: SubmissionPatch): Promise<Submission | null> {
  return withLock(async () => {
    const rows = await readAll();
    const row = rows.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch, { updatedAt: new Date().toISOString() });
    await writeAll(rows);
    return row;
  });
}

export async function deleteSubmission(id: string): Promise<boolean> {
  return withLock(async () => {
    const rows = await readAll();
    const next = rows.filter((r) => r.id !== id);
    if (next.length === rows.length) return false;
    await writeAll(next);
    return true;
  });
}

export async function bulkUpdate(ids: string[], patch: SubmissionPatch): Promise<number> {
  return withLock(async () => {
    const set = new Set(ids);
    const rows = await readAll();
    let n = 0;
    for (const r of rows) {
      if (set.has(r.id)) {
        Object.assign(r, patch, { updatedAt: new Date().toISOString() });
        n++;
      }
    }
    await writeAll(rows);
    return n;
  });
}

export async function bulkDelete(ids: string[]): Promise<number> {
  return withLock(async () => {
    const set = new Set(ids);
    const rows = await readAll();
    const next = rows.filter((r) => !set.has(r.id));
    const removed = rows.length - next.length;
    await writeAll(next);
    return removed;
  });
}

// ---- Aggregates ----------------------------------------------------------

export interface FormSummary {
  formKey: string;
  formLabel: string;
  count: number;
  newCount: number;
  lastAt: string | null;
}

/** Distinct forms that have registered themselves via submissions. */
export async function listForms(): Promise<FormSummary[]> {
  const rows = await readAll();
  const map = new Map<string, FormSummary>();
  for (const r of rows) {
    const cur = map.get(r.formKey) ?? { formKey: r.formKey, formLabel: r.formLabel, count: 0, newCount: 0, lastAt: null };
    cur.count++;
    if (r.status === 'new' && !r.archived) cur.newCount++;
    if (!cur.lastAt || r.createdAt > cur.lastAt) cur.lastAt = r.createdAt;
    cur.formLabel = r.formLabel;
    map.set(r.formKey, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export interface Stats {
  total: number;
  byStatus: Record<SubmissionStatus, number>;
  archived: number;
  formsCount: number;
  last7Days: number;
  recent: Submission[];
}

export async function stats(): Promise<Stats> {
  const rows = await readAll();
  const byStatus: Record<SubmissionStatus, number> = { new: 0, contacted: 0, qualified: 0, converted: 0 };
  let archived = 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let last7Days = 0;
  const forms = new Set<string>();
  for (const r of rows) {
    byStatus[r.status]++;
    if (r.archived) archived++;
    if (new Date(r.createdAt).getTime() >= weekAgo) last7Days++;
    forms.add(r.formKey);
  }
  const recent = [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8);
  return { total: rows.length, byStatus, archived, formsCount: forms.size, last7Days, recent };
}

/** RFC-4180 CSV of the given submissions. */
export function toCsv(rows: Submission[]): string {
  const cols = ['id', 'formKey', 'name', 'email', 'phone', 'status', 'archived', 'sourceUrl', 'ip', 'device', 'browser', 'os', 'assignedTo', 'tags', 'notes', 'createdAt', 'answers'];
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    s = s.replace(/\r?\n/g, ' ');
    return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => esc((r as unknown as Record<string, unknown>)[c])).join(','));
  }
  return lines.join('\n') + '\n';
}
