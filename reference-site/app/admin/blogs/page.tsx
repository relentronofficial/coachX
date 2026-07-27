import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminBlogsPage() {
  return (
    <ModuleShell
      title="Blogs"
      description="Blog posts management. Connect a CMS or a posts collection and it renders here with the same table + actions the Forms module uses."
    />
  );
}
