import { ModuleShell } from '@/components/admin/ModuleShell';
import { stats } from '@/lib/admin/submissions';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const s = await stats();
  const cards = [
    { label: 'Total submissions', value: s.total },
    { label: 'Last 7 days', value: s.last7Days },
    { label: 'Converted', value: s.byStatus.converted },
    { label: 'Forms', value: s.formsCount },
  ];
  return (
    <ModuleShell title="Analytics" status="Live" description="Live engagement metrics from the submission pipeline.">
      <div className="grid gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-slate-200 bg-white p-5">
            <p className="text-3xl font-extrabold text-ink">{c.value}</p>
            <p className="mt-1 text-sm text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
