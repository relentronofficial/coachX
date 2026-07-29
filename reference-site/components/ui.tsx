import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass, type ButtonFx, type ButtonVariant } from '@/lib/ui/buttonFx';
import { Reveal } from './motion/Reveal';

/** Max-width, padded content container. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`container-x ${className}`}>{children}</div>;
}

/**
 * Vertical section wrapper with consistent rhythm.
 *
 * `density` is the only sanctioned way to change a section's vertical padding —
 * the classes it maps to live in the layout-rhythm block in globals.css, so the
 * whole site's spacing stays adjustable from one place. Reach for it instead of
 * putting a `py-*` in `className`.
 *
 * `seam` collapses the gap between two adjacent same-surface sections, which
 * would otherwise stack into a gutter twice as tall as either section intended.
 */
export function Section({
  children,
  className = '',
  id,
  density = 'default',
  seam = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  density?: 'default' | 'tight' | 'flush';
  seam?: boolean;
}) {
  const densityClass = density === 'tight' ? ' section-tight' : density === 'flush' ? ' section-flush' : '';
  return (
    <section id={id} className={`section${densityClass}${seam ? ' section-seam' : ''} ${className}`.trim()}>
      <Container>{children}</Container>
    </section>
  );
}

/** Small label above a heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-3">{children}</p>;
}

/**
 * Section heading + optional lead paragraph, centered by default.
 *
 * The heading block reveals as one unit rather than per-line: eyebrow, title
 * and lead are a single thought, and animating them separately reads as three
 * unrelated things arriving. Spacing tightened from mb-12/mt-4 to mb-8/mt-3 so
 * a heading stays visually attached to the grid it introduces.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal className={`mb-8 ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-h2">{title}</h2>
      {lead ? <p className="mt-3 text-lg text-slate-500">{lead}</p> : null}
    </Reveal>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  /** Motion identity. Defaults per variant — see `lib/ui/buttonFx.ts`. */
  fx?: ButtonFx;
  /** Icon rendered after the label, wrapped so the identity can animate it. */
  icon?: ReactNode;
  className?: string;
};

/**
 * Link styled as a button (pill radius, per design tokens).
 *
 * Stays a server component: navigation buttons need no pointer JS, so they get
 * the CSS motion identity for free with zero client bundle. Use `ActionButton`
 * when a click runs code (ripple, spinner, double-submit guard).
 */
export function Button({ href, children, variant = 'primary', fx, icon, className = '' }: ButtonProps) {
  return (
    <Link href={href} className={buttonClass(variant, fx, className)}>
      <span className="btn-label">{children}</span>
      {icon ? (
        <span className="btn-ico" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </Link>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
