import { listAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const { rows, total } = await listAudit(1, 100);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Audit Logs</h1>
      <p className="mt-1 text-sm text-slate-500">{total} recorded admin action{total === 1 ? '' : 's'}.</p>

      <div className="mt-6 overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No admin actions logged yet.
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 text-xs text-slate-500">{new Date(a.at).toLocaleString()}</td>
                  <td className="p-3 text-slate-600">{a.actor}</td>
                  <td className="p-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{a.action}</code>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-400">{a.target ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
