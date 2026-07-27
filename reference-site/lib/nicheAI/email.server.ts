import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Email integration for niche-finder results.
 *
 * If a provider is configured (RESEND_API_KEY) the message is sent via Resend's
 * HTTP API. Otherwise it is written to a file-backed OUTBOX (.data/niche-emails.json)
 * so the feature is fully functional in local dev and the admin can inspect
 * what would have been sent — matching the app's resilient-fallback pattern.
 */

export interface ResultEmailInput {
  email: string;
  name?: string;
  topNiche?: string;
  score?: number;
  summary?: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'niche-emails.json');

function composeHtml(i: ResultEmailInput): { subject: string; html: string } {
  const subject = `Your CoachX niche result: ${i.topNiche ?? 'your best-fit niche'}`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#0a2e1e">
    <div style="background:linear-gradient(100deg,#105030,#d0a030);padding:24px;border-radius:16px 16px 0 0;color:#fff">
      <h1 style="margin:0;font-size:20px">Your Niche Finder result</h1>
    </div>
    <div style="border:1px solid #e2ede8;border-top:0;padding:24px;border-radius:0 0 16px 16px">
      <p>Hi ${escapeHtml(i.name ?? 'there')},</p>
      <p>Your strongest coaching niche is <strong>${escapeHtml(i.topNiche ?? 'ready to explore')}</strong>
         with a niche score of <strong>${i.score ?? '—'}/100</strong>.</p>
      <p style="color:#4b6a5c">${escapeHtml(i.summary ?? '')}</p>
      <p><a href="#" style="display:inline-block;background:#105030;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none;font-weight:700">View your full report</a></p>
      <p style="color:#93a99e;font-size:12px;margin-top:24px">Sent by CoachX · AI Niche Finder</p>
    </div>
  </div>`;
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

async function appendOutbox(entry: Record<string, unknown>): Promise<void> {
  let rows: unknown[] = [];
  try {
    rows = JSON.parse(await fs.readFile(FILE, 'utf8')) as unknown[];
  } catch {
    rows = [];
  }
  rows.push(entry);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows.slice(-500), null, 2), 'utf8');
}

export async function sendResultEmail(input: ResultEmailInput): Promise<{ ok: boolean; delivered: 'provider' | 'outbox' }> {
  const { subject, html } = composeHtml(input);
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'CoachX <noreply@coachx.local>';

  if (key) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from, to: input.email, subject, html }),
      });
      if (res.ok) return { ok: true, delivered: 'provider' };
    } catch {
      /* fall through to outbox */
    }
  }

  await appendOutbox({ id: randomUUID(), to: input.email, subject, html, at: new Date().toISOString(), delivered: 'outbox' });
  return { ok: true, delivered: 'outbox' };
}
