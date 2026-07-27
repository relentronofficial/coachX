import Link from 'next/link';
import { listForms } from '@/lib/admin/submissions';

export const dynamic = 'force-dynamic';

/** Dynamic list of every form that has registered itself via a submission. */
export default async function AdminFormsPage() {
  const forms = await listForms();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Forms</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every public form auto-registers here. Open one to view, filter, edit and export its submissions.
      </p>

      {forms.length === 0 ? (
        <div className="mt-6 rounded-card border border-slate-200 bg-white p-10 text-center text-slate-400">
          No forms yet. Submit any public form (join, newsletter, a tool…) and it appears here automatically.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <Link
              key={f.formKey}
              href={`/admin/forms/${f.formKey}`}
              className="rounded-card border border-slate-200 bg-white p-5 hover:shadow-soft"
              data-testid={`form-card-${f.formKey}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-ink">{f.formLabel}</h2>
                {f.newCount ? <span className="rounded-pill bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{f.newCount} new</span> : null}
              </div>
              <p className="mt-1 font-mono text-xs text-slate-400">/{f.formKey}</p>
              <p className="mt-3 text-sm text-slate-500">
                {f.count} submission{f.count === 1 ? '' : 's'}
                {f.lastAt ? ` · last ${new Date(f.lastAt).toLocaleDateString()}` : ''}
              </p>
              <p className="mt-3 text-sm font-semibold text-teal">Manage →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
