import { ModuleShell } from '@/components/admin/ModuleShell';
import { faqs } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function AdminFaqsPage() {
  return (
    <ModuleShell title="FAQs" status="Read-only" description="Frequently asked questions shown across the site.">
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-card border border-slate-200 bg-white p-4">
            <p className="font-semibold text-ink">{f.q}</p>
            <p className="mt-1 text-sm text-slate-500">{f.a}</p>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
