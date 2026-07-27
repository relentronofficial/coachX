import { SubmissionsTable } from '@/components/admin/SubmissionsTable';

export const dynamic = 'force-dynamic';

export default function AdminLeadsPage() {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">All lead & registration submissions across every form.</p>
      <SubmissionsTable title="Leads" />
    </div>
  );
}
