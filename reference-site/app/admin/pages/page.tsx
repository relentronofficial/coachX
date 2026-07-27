import Link from 'next/link';

export const dynamic = 'force-dynamic';

/** Editable pages. Homepage is fully CMS-backed; others follow the same pattern. */
const PAGES = [
  { label: 'Homepage (Hero + SEO)', href: '/admin/hero-sections', status: 'Editable' },
  { label: 'Programs', href: '/admin/programs', status: 'Editable' },
  { label: 'Testimonials', href: '/admin/testimonials', status: 'Managed' },
  { label: 'FAQs', href: '/admin/faqs', status: 'Managed' },
  { label: 'Pricing', href: '/admin/pricing', status: 'Managed' },
];

export default function AdminPagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Pages</h1>
      <p className="mt-1 text-sm text-slate-500">Edit page content from the CMS — no code changes required.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((p) => (
          <Link key={p.href} href={p.href} className="rounded-card border border-slate-200 bg-white p-5 hover:shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink">{p.label}</h2>
              <span className="rounded-pill bg-teal/15 px-2 py-0.5 text-xs font-semibold text-teal">{p.status}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-teal">Edit →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
