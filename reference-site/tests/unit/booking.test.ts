import { describe, it, expect } from 'vitest';
import { toBookingQuery, fromBookingQuery, toSubmissionAnswers, type BookingContext } from '@/lib/tools/booking';

const ctx: BookingContext = {
  assessment: 'My Personal Codex',
  assessmentId: 'personal-codex',
  overall: 61,
  weakTopics: [
    { label: 'Pricing Strategy', score: 22 },
    { label: 'Sales Confidence', score: 18 },
  ],
};

const decode = (q: string) => fromBookingQuery(new URLSearchParams(q));

describe('booking query round-trip', () => {
  it('survives a full round-trip unchanged', () => {
    expect(decode(toBookingQuery(ctx))).toEqual(ctx);
  });

  it('preserves order, so the biggest gap stays first', () => {
    expect(decode(toBookingQuery(ctx))!.weakTopics.map((t) => t.label)).toEqual(['Pricing Strategy', 'Sales Confidence']);
  });

  it('survives labels containing the separator and other URL-hostile characters', () => {
    const tricky: BookingContext = {
      assessment: 'A&B "Codex" 100%',
      weakTopics: [
        { label: 'Sales | Pricing', score: 5 },
        { label: 'Brand & Story?', score: 5 },
        { label: 'Offers = 50% off', score: 9 },
      ],
    };
    expect(decode(toBookingQuery(tricky))).toEqual({ ...tricky, assessmentId: undefined, overall: undefined });
  });

  it('handles a context with no weak topics', () => {
    const bare: BookingContext = { assessment: 'Solo', weakTopics: [] };
    expect(decode(toBookingQuery(bare))).toEqual({ ...bare, assessmentId: undefined, overall: undefined });
  });

  it('returns null when no assessment is named', () => {
    expect(decode('weak=x&weakScore=10')).toBeNull();
    expect(decode('')).toBeNull();
  });

  it('keeps labels readable in the URL — no double-encoding', () => {
    const q = toBookingQuery({ assessment: 'T', weakTopics: [{ label: 'Sales & Conversion', score: 0 }] });
    expect(q).toContain('weak=Sales+%26+Conversion');
    expect(q).not.toContain('%2526');
  });

  it('still accepts the older ?source= links', () => {
    expect(decode('source=Legacy%20Tool')!.assessment).toBe('Legacy Tool');
  });
});

describe('booking query hardening (the query string is user input)', () => {
  it('clamps scores into 0..100', () => {
    const out = decode('assessment=T&weak=a&weakScore=999&weak=b&weakScore=-40')!;
    expect(out.weakTopics).toEqual([{ label: 'a', score: 100 }, { label: 'b', score: 0 }]);
  });

  it('drops a topic whose score is not a number', () => {
    const out = decode('assessment=T&weak=a&weakScore=nope&weak=b&weakScore=20')!;
    expect(out.weakTopics).toEqual([{ label: 'b', score: 20 }]);
  });

  it('ignores an unpaired tail rather than mis-aligning', () => {
    expect(decode('assessment=T&weak=a&weakScore=10&weak=b')!.weakTopics).toEqual([{ label: 'a', score: 10 }]);
    expect(decode('assessment=T&weak=a&weakScore=10&weakScore=20')!.weakTopics).toEqual([{ label: 'a', score: 10 }]);
  });

  it('caps the number of topics and the label length', () => {
    const many = Array.from({ length: 40 }, (_, i) => `weak=t${i}&weakScore=10`).join('&');
    expect(decode(`assessment=T&${many}`)!.weakTopics.length).toBeLessThanOrEqual(12);

    const long = decode(`assessment=T&weak=${'x'.repeat(500)}&weakScore=10`)!;
    expect(long.weakTopics[0].label.length).toBeLessThanOrEqual(80);
  });

  it('does not throw on a malformed percent-escape', () => {
    expect(() => decode('assessment=T&weak=%E0%A4%A&weakScore=10')).not.toThrow();
  });

  it('omits overall when absent or unparseable', () => {
    expect(decode('assessment=T')!.overall).toBeUndefined();
    expect(decode('assessment=T&overall=abc')!.overall).toBeUndefined();
  });
});

describe('toSubmissionAnswers', () => {
  it('produces the fields the coach needs before the call', () => {
    expect(toSubmissionAnswers(ctx)).toEqual({
      assessment: 'My Personal Codex',
      assessmentId: 'personal-codex',
      weakTopics: ['Pricing Strategy', 'Sales Confidence'],
      weakScores: ['22%', '18%'],
      overallScore: '61%',
    });
  });

  it('omits empty sections rather than writing blanks', () => {
    expect(toSubmissionAnswers({ assessment: 'Solo', weakTopics: [] })).toEqual({ assessment: 'Solo' });
  });
});
