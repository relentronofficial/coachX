import type { StyleSample } from '../extractors/componentExtractor';
import type { DesignSystem } from '../schemas/site.schema';

interface Counter {
  [value: string]: number;
}

function tally(values: (string | undefined | null)[]): Counter {
  const c: Counter = {};
  for (const v of values) {
    const val = (v ?? '').trim();
    if (!val || val === 'none' || val === 'normal' || val === '0px' || val === 'auto') continue;
    c[val] = (c[val] ?? 0) + 1;
  }
  return c;
}

function topN(c: Counter, n: number): { value: string; count: number }[] {
  return Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

// Convert rgb()/rgba() to normalized hex-ish key so equivalent colours merge.
function normColor(v: string): string | null {
  const s = v.trim().toLowerCase();
  if (!s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return null;
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(',').map((p) => p.trim());
    const [r, g, b, a] = parts;
    if (a !== undefined && Number(a) < 0.05) return null;
    const hex = [r, g, b].map((x) => Number(x).toString(16).padStart(2, '0')).join('');
    return '#' + hex;
  }
  return s;
}

/** Rough luminance for classifying a colour as neutral / background vs accent. */
function luminance(hex: string): number {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return 0.5;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function isNeutral(hex: string): boolean {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 18; // low chroma => grey/neutral
}

/** Aggregate raw computed-style samples into a summarized design-token system. */
export function analyzeDesignSystem(samples: StyleSample[]): DesignSystem {
  // Colours.
  const fgColors = tally(samples.map((s) => normColor(s.color)));
  const bgColors = tally(
    samples.filter((s) => s.role === 'section' || s.role === 'card' || s.role === 'button').map((s) => normColor(s.backgroundColor)),
  );

  const allColorCounter: Counter = {};
  for (const [k, v] of Object.entries(fgColors)) allColorCounter[k] = (allColorCounter[k] ?? 0) + v;
  for (const [k, v] of Object.entries(bgColors)) allColorCounter[k] = (allColorCounter[k] ?? 0) + v;
  const allColors = topN(allColorCounter, 24);

  const buttonBg = topN(tally(samples.filter((s) => s.role === 'button').map((s) => normColor(s.backgroundColor))), 8);
  const nonNeutralByFreq = allColors.filter((c) => /^#/.test(c.value) && !isNeutral(c.value));
  const neutrals = allColors.filter((c) => /^#/.test(c.value) && isNeutral(c.value)).map((c) => c.value);
  const backgrounds = topN(bgColors, 8)
    .map((c) => c.value)
    .filter((c) => luminance(c) > 0.85 || isNeutral(c));

  return {
    colors: {
      // Primary = most-used accent colours, favouring button backgrounds.
      primary: [...new Set([...buttonBg.map((b) => b.value).filter((v) => /^#/.test(v) && !isNeutral(v)), ...nonNeutralByFreq.map((c) => c.value)])].slice(0, 4),
      secondary: nonNeutralByFreq.map((c) => c.value).slice(4, 10),
      neutral: neutrals.slice(0, 8),
      background: [...new Set(backgrounds)].slice(0, 6),
      border: topN(tally(samples.map((s) => normColor(s.backgroundColor))), 6).map((c) => c.value).filter((c) => isNeutral(c)).slice(0, 4),
      all: allColors,
    },
    typography: {
      fontFamilies: topN(tally(samples.map((s) => s.fontFamily)), 8),
      fontSizes: topN(tally(samples.map((s) => s.fontSize)), 14),
      fontWeights: topN(tally(samples.map((s) => s.fontWeight)), 8),
      lineHeights: topN(tally(samples.map((s) => s.lineHeight)), 10),
      letterSpacings: topN(tally(samples.map((s) => s.letterSpacing)), 6),
    },
    radii: topN(tally(samples.map((s) => s.borderRadius)), 10),
    shadows: topN(tally(samples.map((s) => s.boxShadow)), 8),
    spacing: topN(tally(samples.map((s) => s.padding)), 14),
    controls: {
      buttonHeights: topN(tally(samples.filter((s) => s.role === 'button').map((s) => s.height)), 6).map((c) => c.value),
      inputHeights: topN(tally(samples.filter((s) => s.role === 'input').map((s) => s.height)), 6).map((c) => c.value),
      containerWidths: topN(tally(samples.filter((s) => s.role === 'section').map((s) => s.width)), 6).map((c) => c.value),
    },
    breakpointsInferred: ['390px (mobile)', '768px (tablet)', '1024px (small desktop)', '1440px (desktop)'],
  };
}
