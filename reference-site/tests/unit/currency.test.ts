import { describe, it, expect } from 'vitest';
import {
  INR_SYMBOL,
  USD_TO_INR,
  formatINR,
  formatINRCompact,
  formatINRNumber,
  formatINRRange,
  usdToInr,
} from '@/lib/currency';

describe('formatINR — Indian numbering system', () => {
  it('groups by the lakh/crore convention, not thousands', () => {
    expect(formatINR(1_000)).toBe('₹1,000');
    expect(formatINR(10_000)).toBe('₹10,000');
    expect(formatINR(1_00_000)).toBe('₹1,00,000');
    expect(formatINR(10_00_000)).toBe('₹10,00,000');
    expect(formatINR(1_00_00_000)).toBe('₹1,00,00,000');
  });

  it('never emits the western grouping', () => {
    expect(formatINR(1_00_000)).not.toBe('₹100,000');
    expect(formatINR(1_00_00_000)).not.toBe('₹10,000,000');
  });

  it('shows no decimals and no space after the symbol', () => {
    expect(formatINR(1234.56)).toBe('₹1,235');
    expect(formatINR(500)).toBe(`${INR_SYMBOL}500`);
    expect(formatINR(500)).not.toMatch(/₹\s/);
  });

  it('handles zero and negatives without breaking', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-5000)).toContain('5,000');
  });

  it('degrades to ₹0 rather than "₹NaN" on bad input', () => {
    expect(formatINR(Number.NaN)).toBe('₹0');
    expect(formatINR(Number.POSITIVE_INFINITY)).toBe('₹0');
  });
});

describe('formatINRNumber', () => {
  it('groups like formatINR but without the symbol', () => {
    expect(formatINRNumber(1_00_000)).toBe('1,00,000');
    expect(formatINRNumber(1_00_000)).not.toContain(INR_SYMBOL);
  });
});

describe('formatINRRange', () => {
  it('renders both ends with an en dash', () => {
    expect(formatINRRange(1_00_000, 15_00_000)).toBe('₹1,00,000–₹15,00,000');
  });
});

describe('formatINRCompact', () => {
  it('uses lakh and crore for large amounts', () => {
    expect(formatINRCompact(1_00_000)).toBe('₹1 L');
    expect(formatINRCompact(2_50_000)).toBe('₹2.5 L');
    expect(formatINRCompact(1_00_00_000)).toBe('₹1 Cr');
    expect(formatINRCompact(1_50_00_000)).toBe('₹1.5 Cr');
  });

  it('falls back to full grouping below a lakh, where "₹0.4 L" reads worse', () => {
    expect(formatINRCompact(40_000)).toBe('₹40,000');
    expect(formatINRCompact(99_999)).toBe('₹99,999');
  });

  it('never leaves a trailing .0', () => {
    expect(formatINRCompact(3_00_000)).toBe('₹3 L');
    expect(formatINRCompact(3_00_000)).not.toContain('.0');
  });
});

describe('usdToInr', () => {
  it('converts at the single documented rate', () => {
    expect(usdToInr(1000, 1)).toBe(1000 * USD_TO_INR);
  });

  it('rounds to a clean step so bands read well', () => {
    // 2500 × 83 = 2,07,500 → nearest 5,000 → 2,10,000
    expect(usdToInr(2500, 5000)).toBe(2_10_000);
    expect(usdToInr(2500, 5000) % 5000).toBe(0);
  });

  it('is monotonic — a bigger USD figure never converts to a smaller INR one', () => {
    let prev = -1;
    for (const usd of [1000, 2500, 5000, 12000, 18000, 45000]) {
      const inr = usdToInr(usd, 5000);
      expect(inr).toBeGreaterThan(prev);
      prev = inr;
    }
  });

  it('degrades to 0 on bad input', () => {
    expect(usdToInr(Number.NaN)).toBe(0);
  });
});
