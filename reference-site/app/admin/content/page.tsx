import { ModuleShell } from '@/components/admin/ModuleShell';
import { guides } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function AdminContentPage() {
  return (
    <ModuleShell title="Content" status="Read-only" description="Guides and content pages published on the site.">
      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Read time</th>
              <th className="p-3">Slug</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((g) => (
              <tr key={g.slug} className="border-b border-slate-100 last:border-0">
                <td className="p-3 font-medium text-ink">{g.title}</td>
                <td className="p-3 text-slate-600">{g.minutes} min</td>
                <td className="p-3 font-mono text-xs text-slate-400">/guides/{g.slug}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleShell>
  );
}
