import { SubmissionsTable } from '@/components/admin/SubmissionsTable';

export const dynamic = 'force-dynamic';

/** Payment requests flow in as submissions with formKey "payment". */
export default function AdminPaymentsPage() {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">
        Payment requests (formKey <code className="rounded bg-slate-100 px-1">payment</code>). Payment is not yet enabled — this
        populates automatically once a payment/checkout form posts to <code className="rounded bg-slate-100 px-1">/api/submit</code>.
      </p>
      <SubmissionsTable formKey="payment" title="Payments" />
    </div>
  );
}
