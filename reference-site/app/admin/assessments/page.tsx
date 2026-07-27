import Link from 'next/link';
import { listForms } from '@/lib/admin/submissions';
import { ASSESSMENT_FORM_KEYS } from '@/lib/admin/nav';

export const dynamic = 'force-dynamic';

/** Assessment / tool submissions grouped by tool. */
export default async function AdminAssessmentsPage() {
  const forms = (await listForms()).filter((f) => ASSESSMENT_FORM_KEYS.includes(f.formKey));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Assessments</h1>
      <p className="mt-1 text-sm text-slate-500">Completed tool & assessment submissions, grouped by tool.</p>

      {forms.length === 0 ? (
        <div className="mt-6 rounded-card border border-slate-200 bg-white p-10 text-center text-slate-400">
          No assessment submissions yet. Complete any tool (e.g. Niche Finder) to see results here.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <Link key={f.formKey} href={`/admin/forms/${f.formKey}`} className="rounded-card border border-slate-200 bg-white p-5 hover:shadow-soft">
              <h2 className="font-bold text-ink">{f.formLabel}</h2>
              <p className="mt-2 text-sm text-slate-500">{f.count} completion{f.count === 1 ? '' : 's'}</p>
              <p className="mt-3 text-sm font-semibold text-teal">View submissions →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
