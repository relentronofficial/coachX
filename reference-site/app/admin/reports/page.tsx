import { ModuleShell } from '@/components/admin/ModuleShell';
import { stats, listForms } from '@/lib/admin/submissions';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const [s, forms] = await Promise.all([stats(), listForms()]);
  const conversionRate = s.total ? Math.round((s.byStatus.converted / s.total) * 100) : 0;

  return (
    <ModuleShell title="Reports" status="Live" description="Aggregate metrics across all submissions.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <p className="text-3xl font-extrabold text-ink">{s.total}</p>
          <p className="text-sm text-slate-500">Total submissions</p>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <p className="text-3xl font-extrabold text-teal">{conversionRate}%</p>
          <p className="text-sm text-slate-500">Converted</p>
        </div>
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <p className="text-3xl font-extrabold text-ink">{s.last7Days}</p>
          <p className="text-sm text-slate-500">New (7 days)</p>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Submissions by form</h2>
        <ul className="mt-3 space-y-2">
          {forms.map((f) => {
            const pct = s.total ? Math.round((f.count / s.total) * 100) : 0;
            return (
              <li key={f.formKey}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink">{f.formLabel}</span>
                  <span className="text-slate-500">{f.count} ({pct}%)</span>
                </div>
                <div className="mt-1 h-2 rounded-pill bg-slate-100">
                  <div className="h-full rounded-pill bg-teal" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
          {forms.length === 0 ? <li className="text-sm text-slate-400">No data yet.</li> : null}
        </ul>
      </div>
    </ModuleShell>
  );
}
