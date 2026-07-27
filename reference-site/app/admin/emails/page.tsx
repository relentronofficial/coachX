import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminEmailsPage() {
  return (
    <ModuleShell
      title="Emails"
      description="Transactional & broadcast email templates (welcome, reset, workshop details). Editable subject/body stored as CMS docs; connect a provider to send."
    />
  );
}
