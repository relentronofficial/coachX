import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminNotificationsPage() {
  return (
    <ModuleShell
      title="Notifications"
      description="Admin alerts (new leads, conversions, failures). Emit events into a notifications store to populate this feed."
    />
  );
}
