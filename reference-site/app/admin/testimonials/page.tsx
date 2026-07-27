import { ModuleShell } from '@/components/admin/ModuleShell';
import { stories } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function AdminTestimonialsPage() {
  return (
    <ModuleShell title="Testimonials" status="Read-only" description="Success stories published on the site.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s) => (
          <div key={s.slug} className="rounded-card border border-slate-200 bg-white p-4">
            <p className="font-bold text-ink">{s.name}</p>
            <p className="text-xs font-semibold text-teal">{s.result}</p>
            <p className="mt-2 text-sm text-slate-500">“{s.quote}”</p>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
