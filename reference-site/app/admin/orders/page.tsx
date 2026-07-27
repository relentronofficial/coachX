import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminOrdersPage() {
  return (
    <ModuleShell
      title="Orders"
      description="Purchases and enrollments. When checkout is enabled, orders post to /api/submit with formKey 'order' and appear here automatically."
    />
  );
}
