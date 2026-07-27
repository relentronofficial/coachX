import Link from 'next/link';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { listForms } from '@/lib/admin/submissions';

export const dynamic = 'force-dynamic';

export default async function AdminFormPage({ params }: { params: Promise<{ formKey: string }> }) {
  const { formKey } = await params;
  const forms = await listForms();
  const form = forms.find((f) => f.formKey === formKey);
  const label = form?.formLabel ?? formKey;

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/forms" className="text-sm font-semibold text-teal hover:underline">
          ← All forms
        </Link>
      </div>
      <SubmissionsTable formKey={formKey} title={label} />
    </div>
  );
}
