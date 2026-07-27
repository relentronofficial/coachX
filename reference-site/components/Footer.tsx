import Link from 'next/link';
import { brand, footerNav } from '@/lib/site';
import { Container } from './ui';
import { Newsletter } from './Newsletter';
import { Logo } from './Logo';

/** Site footer: newsletter CTA + link columns + legal row. */
export function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-slate-50">
      <Container className="py-14">
        <Newsletter />

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" aria-label="CoachX home" className="inline-block">
              <Logo height={40} poweredBy />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">{brand.tagline}</p>
          </div>

          {footerNav.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-slate-500 hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {brand.name}. Placeholder scaffold — not affiliated with any real company.</p>
          <p>Built as an original reference template.</p>
        </div>
      </Container>
    </footer>
  );
}
