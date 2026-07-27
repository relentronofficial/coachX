import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminBannersPage() {
  return (
    <ModuleShell
      title="Banners"
      description="Announcement bars and promotional banners. Stored as CMS docs and rendered site-wide via the same content store as the homepage."
    />
  );
}
