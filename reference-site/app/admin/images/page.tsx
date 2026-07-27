import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminImagesPage() {
  return (
    <ModuleShell
      title="Images"
      description="Media library for images. Uploads map to /public/brand and CMS media records; referenced by pages, programs and blogs."
    />
  );
}
