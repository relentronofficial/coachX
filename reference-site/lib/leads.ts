import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Lead-capture store (NO payment). Registrations and newsletter opt-ins are
 * validated and appended to a local JSON file so the flow is genuinely working
 * end-to-end in development. Swap `saveLead` for your CRM/DB/email provider when
 * you go live. We store only what the user typed — nothing sensitive.
 */

export type LeadType = 'workshop' | 'newsletter' | 'contact' | 'interest';

export interface Lead {
  id: string;
  type: LeadType;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  note: string | null;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'leads.json');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LeadInput {
  type?: string;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  source?: unknown;
  note?: unknown;
}

export function validateLead(input: LeadInput): { ok: true; value: Omit<Lead, 'id' | 'createdAt'> } | { ok: false; error: string } {
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };

  const allowed: LeadType[] = ['workshop', 'newsletter', 'contact', 'interest'];
  const type = (allowed as string[]).includes(String(input.type)) ? (input.type as LeadType) : 'interest';

  const str = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

  return {
    ok: true,
    value: {
      type,
      name: str(input.name, 80),
      email: email.slice(0, 160),
      phone: str(input.phone, 32),
      source: str(input.source, 60),
      note: str(input.note, 500),
    },
  };
}

/** Append a lead to the local store. Never throws — returns the saved lead. */
export async function saveLead(value: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
  const lead: Lead = { id: randomUUID(), createdAt: new Date().toISOString(), ...value };
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let list: Lead[] = [];
    try {
      list = JSON.parse(await fs.readFile(FILE, 'utf8')) as Lead[];
    } catch {
      list = [];
    }
    list.push(lead);
    await fs.writeFile(FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch {
    // Read-only FS (e.g. some serverless): the lead is still acknowledged.
    // Wire a real provider here in production.
  }
  return lead;
}

/** Short human-friendly reference derived from the UUID. */
export function shortRef(id: string): string {
  return 'CX-' + id.replace(/-/g, '').slice(0, 6).toUpperCase();
}
