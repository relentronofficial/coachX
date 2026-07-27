import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass, type ButtonFx, type ButtonVariant } from '@/lib/ui/buttonFx';

/** Max-width, padded content container. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`container-x ${className}`}>{children}</div>;
}

/** Vertical section wrapper with consistent rhythm. */
export function Section({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`section ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/** Small label above a heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-3">{children}</p>;
}

/** Section heading + optional lead paragraph, centered by default. */
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
    <div className={`mb-12 ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-h2">{title}</h2>
      {lead ? <p className="mt-4 text-lg text-slate-500">{lead}</p> : null}
    </div>
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
