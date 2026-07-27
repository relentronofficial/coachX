/**
 * Button motion identities.
 *
 * Pure mapping from a button's *role* to its visual variant and motion class,
 * kept out of the components so it is unit-testable and so there is exactly one
 * place that decides what a "booking" button looks and feels like.
 *
 * The CSS lives in the BUTTON MOTION LAYER in `app/globals.css`; this file only
 * names the classes. Adding an identity means adding one entry here and one
 * `.btn-fx-*` block there — never a bespoke hover rule on a single button.
 */

/** Visual style (colour/border). Independent of motion. */
export type ButtonVariant = 'primary' | 'amber' | 'secondary' | 'ghost';

/** Motion identity. One per button *category*, per the design spec. */
export type ButtonFx =
  | 'sweep' // primary CTA — gradient sweep, scale, glow, arrow slide, ripple
  | 'lift' // secondary — soft lift, border + background fade
  | 'success' // success — pulse, glow, checkmark morph
  | 'danger' // destructive — shake, red glow, press depth, arm-to-confirm
  | 'icon' // icon-only — rotate, scale, circular ripple
  | 'nav' // navigation — sliding underline, elevation
  | 'step' // assessment next/back — arrow slide, progress pulse
  | 'ai' // AI actions — animated gradient border, orbiting glow
  | 'book' // booking — gold glow, float, icon bounce, magnetic pull
  | 'card' // card action — lifts with its card, depth
  | 'none';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  amber: 'btn-amber',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

const FX_CLASS: Record<ButtonFx, string> = {
  sweep: 'btn-fx-sweep',
  lift: 'btn-fx-lift',
  success: 'btn-fx-success',
  danger: 'btn-fx-danger',
  icon: 'btn-fx-icon',
  nav: 'btn-fx-nav',
  step: 'btn-fx-step',
  ai: 'btn-fx-ai',
  book: 'btn-fx-book',
  card: 'btn-fx-card',
  none: '',
};

/** Motion each variant gets when the caller does not name one. */
const DEFAULT_FX: Record<ButtonVariant, ButtonFx> = {
  primary: 'sweep',
  amber: 'sweep',
  secondary: 'lift',
  ghost: 'lift',
};

/** Identities whose ripple must be dark to stay visible on a light surface. */
const DARK_RIPPLE_VARIANTS: ReadonlySet<ButtonVariant> = new Set<ButtonVariant>(['secondary', 'ghost']);

export function buttonClass(variant: ButtonVariant, fx?: ButtonFx, extra = ''): string {
  const resolved = fx ?? DEFAULT_FX[variant];
  return [VARIANT_CLASS[variant], FX_CLASS[resolved], extra].filter(Boolean).join(' ');
}

export function resolveFx(variant: ButtonVariant, fx?: ButtonFx): ButtonFx {
  return fx ?? DEFAULT_FX[variant];
}

export function rippleClass(variant: ButtonVariant): string {
  return DARK_RIPPLE_VARIANTS.has(variant) ? 'btn-ripple btn-ripple-dark' : 'btn-ripple';
}
