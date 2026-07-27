import Link from 'next/link';
import { stats, listForms } from '@/lib/admin/submissions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [s, forms] = await Promise.all([stats(), listForms()]);

  const cards = [
    { label: 'Total submissions', value: s.total, href: '/admin/forms' },
    { label: 'New (last 7 days)', value: s.last7Days, href: '/admin/leads' },
    { label: 'Registered forms', value: s.formsCount, href: '/admin/forms' },
    { label: 'Archived', value: s.archived, href: '/admin/forms' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Every public form flows into the panel automatically.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-card border border-slate-200 bg-white p-5 hover:shadow-soft">
            <p className="text-3xl font-extrabold text-ink">{c.value}</p>
            <p className="mt-1 text-sm text-slate-500">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Pipeline by status */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {(['new', 'contacted', 'qualified', 'converted'] as const).map((st) => (
          <div key={st} className="rounded-card border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-teal">{s.byStatus[st]}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">{st}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Forms */}
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Registered forms</h2>
          {forms.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No forms yet — submit any public form to see it here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {forms.map((f) => (
                <li key={f.formKey} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/forms/${f.formKey}`} className="font-medium text-ink hover:text-teal">
                    {f.formLabel}
                  </Link>
                  <span className="text-slate-500">
                    {f.count} total{f.newCount ? ` · ${f.newCount} new` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent */}
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Recent submissions</h2>
          {s.recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nothing yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {s.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium text-ink">{r.name ?? r.email ?? 'Anonymous'}</span>
                    <span className="ml-2 text-xs text-slate-400">{r.formLabel}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
