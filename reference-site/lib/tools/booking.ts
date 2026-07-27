import type { ClarityArea } from './engine';

/**
 * The assessment context carried from a result page into the booking form.
 *
 * Serialised into the URL rather than held in memory so the booking page keeps
 * working across a refresh, a shared link, or a new tab. Both sides of the
 * contract live here so the encoder and decoder can never drift apart.
 *
 * Everything decoded here is attacker-controllable (it is just a query string)
 * and ends up rendered in the admin panel, so `fromBookingQuery` bounds every
 * field rather than trusting it.
 */
export interface BookingContext {
  /** Human name of the assessment, e.g. "My Personal Codex". */
  assessment: string;
  /** Tool slug, when known — the stable id for the assessment. */
  assessmentId?: string;
  /** Headline assessment score, 0–100. */
  overall?: number;
  /** Areas below the clarity threshold, worst first. */
  weakTopics: ClarityArea[];
}

const MAX_TOPICS = 12;
const MAX_LABEL = 80;
const MAX_ASSESSMENT = 120;

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Encode a context as a query string (no leading `?`).
 *
 * Weak topics ride as *repeated* `weak` / `weakScore` params rather than one
 * packed value: `URLSearchParams` then owns all the escaping, so no label can
 * collide with a separator and the URL stays readable.
 */
export function toBookingQuery(ctx: BookingContext): string {
  const params = new URLSearchParams();
  params.set('assessment', ctx.assessment);
  if (ctx.assessmentId) params.set('assessmentId', ctx.assessmentId);
  if (typeof ctx.overall === 'number' && Number.isFinite(ctx.overall)) {
    params.set('overall', String(clampPct(ctx.overall)));
  }
  for (const topic of ctx.weakTopics.slice(0, MAX_TOPICS)) {
    params.append('weak', topic.label);
    params.append('weakScore', String(clampPct(topic.score)));
  }
  return params.toString();
}

/** Decode a context, or `null` when the query names no assessment. */
export function fromBookingQuery(params: URLSearchParams): BookingContext | null {
  // `source` is the older single-param form this replaced — still honoured so
  // links already in the wild keep resolving.
  const assessment = (params.get('assessment') ?? params.get('source') ?? '').trim();
  if (!assessment) return null;

  // getAll preserves document order, so labels and scores stay aligned; a
  // truncated or padded query simply drops the unpaired tail.
  const labels = params.getAll('weak');
  const scores = params.getAll('weakScore');
  const weakTopics: ClarityArea[] = [];
  for (let i = 0; i < Math.min(labels.length, scores.length, MAX_TOPICS); i++) {
    const label = labels[i].trim().slice(0, MAX_LABEL);
    const score = Number(scores[i]);
    if (label && Number.isFinite(score)) weakTopics.push({ label, score: clampPct(score) });
  }

  const overall = Number(params.get('overall'));
  return {
    assessment: assessment.slice(0, MAX_ASSESSMENT),
    assessmentId: params.get('assessmentId')?.trim().slice(0, MAX_LABEL) || undefined,
    overall: params.has('overall') && Number.isFinite(overall) ? clampPct(overall) : undefined,
    weakTopics,
  };
}

/**
 * Flatten a context into the `answers` payload stored with the booking, so the
 * coach sees which topics to prepare before the call. Ordering is worst-first,
 * so `weakTopics[0]` is the biggest gap.
 */
export function toSubmissionAnswers(ctx: BookingContext): Record<string, unknown> {
  const out: Record<string, unknown> = { assessment: ctx.assessment };
  if (ctx.assessmentId) out.assessmentId = ctx.assessmentId;
  if (ctx.weakTopics.length) {
    out.weakTopics = ctx.weakTopics.map((t) => t.label);
    out.weakScores = ctx.weakTopics.map((t) => `${t.score}%`);
  }
  if (typeof ctx.overall === 'number') out.overallScore = `${ctx.overall}%`;
  return out;
}
