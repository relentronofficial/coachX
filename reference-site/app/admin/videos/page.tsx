import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminVideosPage() {
  return (
    <ModuleShell
      title="Videos"
      description="Video library — embeds (YouTube/Vimeo) and uploads, referenced by pages and lessons via CMS media records."
    />
  );
}
