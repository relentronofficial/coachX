/**
 * Currency formatting — Indian Rupee (INR), `en-IN` locale.
 *
 * The single place money becomes a string. Formatting goes through `Intl`, so
 * grouping follows the Indian numbering system automatically:
 *
 *   1000      → ₹1,000
 *   100000    → ₹1,00,000     (not ₹100,000)
 *   10000000  → ₹1,00,00,000  (not ₹10,000,000)
 *
 * Formatters are constructed once at module load — `Intl.NumberFormat` is
 * expensive to build and these are called per row in tables and charts.
 */

export const INR_SYMBOL = '₹';
export const INR_LOCALE = 'en-IN';
export const INR_CURRENCY = 'INR';

const currencyFmt = new Intl.NumberFormat(INR_LOCALE, {
  style: 'currency',
  currency: INR_CURRENCY,
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat(INR_LOCALE, { maximumFractionDigits: 0 });

/**
 * ICU has shipped `₹1,00,000` and `₹ 1,00,000` (with a non-breaking space) in
 * different versions. Normalising here keeps the symbol tight against the
 * number everywhere — tables stay aligned and the UI never shows two spacings
 * side by side depending on the Node/browser build.
 */
const tighten = (s: string) => s.replace(/ /g, '').replace(/^(₹)\s+/, '$1');

/** `1234567` → `₹12,34,567`. Non-finite input formats as `₹0`. */
export function formatINR(amount: number): string {
  return tighten(currencyFmt.format(Number.isFinite(amount) ? amount : 0));
}

/** Grouped digits without the symbol: `1234567` → `12,34,567`. */
export function formatINRNumber(amount: number): string {
  return numberFmt.format(Number.isFinite(amount) ? amount : 0);
}

/**
 * A range with one symbol rather than two: `₹2,00,000–₹15,00,000`.
 * Uses an en dash, matching the rest of the copy.
 */
export function formatINRRange(low: number, high: number): string {
  return `${formatINR(low)}–${formatINR(high)}`;
}

/**
 * Lakh / crore short form, which is how Indian audiences actually read large
 * money: `250000` → `₹2.5 L`, `15000000` → `₹1.5 Cr`. Below ₹1 lakh this falls
 * back to the full grouped form, since `₹0.4 L` reads worse than `₹40,000`.
 */
export function formatINRCompact(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `${INR_SYMBOL}${trim(n / 1_00_00_000)} Cr`;
  if (abs >= 1_00_000) return `${INR_SYMBOL}${trim(n / 1_00_000)} L`;
  return formatINR(n);
}

/** One decimal place, but never a trailing `.0`. */
function trim(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/* -------------------------------------------------------------------------- */
/*  USD → INR for the editorial market model                                  */
/* -------------------------------------------------------------------------- */

/**
 * The Niche Finder's revenue model was authored in USD (see
 * `lib/nicheAI/knowledgeBase.ts`). Those amounts are *editorial estimates that
 * get displayed*, not inputs to any score — so they are converted here rather
 * than having their symbol swapped, which would have told an Indian coach that
 * an established practice earns ₹2,500/month.
 *
 * This is the one place the rate lives. Set it to 1 to go back to a pure
 * symbol swap with no re-scaling.
 */
export const USD_TO_INR = 83;

/**
 * Convert an editorial USD figure and round to a clean step, so bands read as
 * `₹2,00,000` rather than `₹2,07,500`.
 */
export function usdToInr(usd: number, roundTo = 1000): number {
  if (!Number.isFinite(usd)) return 0;
  const raw = usd * USD_TO_INR;
  if (roundTo <= 0) return Math.round(raw);
  return Math.round(raw / roundTo) * roundTo;
}
