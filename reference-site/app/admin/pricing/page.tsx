import Link from 'next/link';
import { ModuleShell } from '@/components/admin/ModuleShell';
import { listPrograms } from '@/lib/cms/store';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  const programs = await listPrograms();
  return (
    <ModuleShell title="Pricing" status="Live" description="Pricing is defined by Programs. Edit prices under the Programs module.">
      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Program</th><th className="p-3">Price</th><th className="p-3">Published</th></tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="p-3 font-medium text-ink">{p.name}</td>
                <td className="p-3 text-slate-600">{p.price} {p.cadence}</td>
                <td className="p-3">{p.published ? 'Yes' : 'Draft'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/admin/programs" className="mt-4 inline-block text-sm font-semibold text-teal hover:underline">Edit in Programs →</Link>
    </ModuleShell>
  );
}
