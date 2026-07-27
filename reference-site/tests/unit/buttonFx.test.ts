import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buttonClass, resolveFx, rippleClass, type ButtonFx, type ButtonVariant } from '@/lib/ui/buttonFx';

const VARIANTS: ButtonVariant[] = ['primary', 'amber', 'secondary', 'ghost'];
const FX: ButtonFx[] = ['sweep', 'lift', 'success', 'danger', 'icon', 'nav', 'step', 'ai', 'book', 'card', 'none'];

const css = readFileSync(path.join(process.cwd(), 'app', 'globals.css'), 'utf8');

describe('buttonClass', () => {
  it('pairs the visual variant with a motion identity', () => {
    expect(buttonClass('primary', 'sweep')).toBe('btn-primary btn-fx-sweep');
    expect(buttonClass('secondary', 'lift')).toBe('btn-secondary btn-fx-lift');
  });

  it('gives every variant a sensible default identity', () => {
    expect(resolveFx('primary')).toBe('sweep');
    expect(resolveFx('amber')).toBe('sweep');
    expect(resolveFx('secondary')).toBe('lift');
    expect(resolveFx('ghost')).toBe('lift');
  });

  it('lets an explicit fx override the default', () => {
    expect(resolveFx('primary', 'book')).toBe('book');
    expect(buttonClass('primary', 'ai')).toContain('btn-fx-ai');
  });

  it('emits no fx class for "none", without leaving stray whitespace', () => {
    expect(buttonClass('ghost', 'none')).toBe('btn-ghost');
    expect(buttonClass('ghost', 'none')).not.toMatch(/\s{2,}|^\s|\s$/);
  });

  it('appends caller classes last so they can override', () => {
    expect(buttonClass('primary', 'sweep', 'w-full')).toBe('btn-primary btn-fx-sweep w-full');
  });

  it('never produces a double space for any combination', () => {
    for (const v of VARIANTS) {
      for (const f of FX) {
        const cls = buttonClass(v, f);
        expect(cls, `${v}/${f}`).not.toMatch(/\s{2,}|^\s|\s$/);
      }
    }
  });
});

describe('rippleClass', () => {
  it('uses a dark ripple on light surfaces so it stays visible', () => {
    expect(rippleClass('secondary')).toContain('btn-ripple-dark');
    expect(rippleClass('ghost')).toContain('btn-ripple-dark');
  });

  it('uses the light ripple on filled brand buttons', () => {
    expect(rippleClass('primary')).toBe('btn-ripple');
    expect(rippleClass('amber')).toBe('btn-ripple');
  });
});

describe('the motion layer backs every identity', () => {
  it('defines a CSS rule for each fx the mapping can emit', () => {
    for (const f of FX) {
      if (f === 'none') continue;
      expect(css, `missing .btn-fx-${f} in globals.css`).toContain(`.btn-fx-${f}`);
    }
  });

  it('animates only compositor-friendly properties', () => {
    // Grab every `transition:` / `transition-property:` declaration in the
    // button layer and assert none of them animate a layout property — those
    // are what make hover states drop frames.
    const banned = /\b(width|height|top|left|right|bottom|margin|padding|font-size)\b/;
    const layer = css.slice(css.indexOf('BUTTON MOTION LAYER'));
    const declarations = layer.match(/transition(-property)?:[^;]+;/g) ?? [];
    expect(declarations.length).toBeGreaterThan(0);
    for (const d of declarations) expect(d, d).not.toMatch(banned);
  });

  it('neutralises motion under prefers-reduced-motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    const block = css.slice(css.indexOf('Reduced motion: keep every state change'));
    // The identities that move must all be listed in the reduce block.
    for (const f of ['sweep', 'lift', 'icon', 'nav', 'book', 'card', 'ai']) {
      expect(block, `.btn-fx-${f} not neutralised`).toContain(`btn-fx-${f}`);
    }
    expect(block).toContain('.btn-ripple');
    expect(block).toContain('.btn-spinner');
  });

  it('keeps the documented timing budget', () => {
    expect(css).toMatch(/--btn-dur:\s*2\d\dms/); // 150–300ms hover
    expect(css).toMatch(/--btn-press:\s*1\d\dms/); // 80–150ms click
    expect(css).toContain('--btn-spring: cubic-bezier(');
  });
});
