import { ModuleShell } from '@/components/admin/ModuleShell';
import { tools } from '@/lib/tools';

export const dynamic = 'force-dynamic';

export default function AdminToolsPage() {
  return (
    <ModuleShell title="Tools" status="Read-only" description="Interactive tools published on the site. Their completions appear under Assessments.">
      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Tool</th>
              <th className="p-3">Category</th>
              <th className="p-3">Route</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t) => (
              <tr key={t.slug} className="border-b border-slate-100 last:border-0">
                <td className="p-3 font-medium text-ink">{t.icon} {t.name}</td>
                <td className="p-3 text-slate-600">{t.category}</td>
                <td className="p-3 font-mono text-xs text-slate-400">{t.href}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleShell>
  );
}
