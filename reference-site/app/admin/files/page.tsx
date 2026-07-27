import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminFilesPage() {
  return (
    <ModuleShell
      title="Files"
      description="Downloads & documents (PDFs, worksheets). Stored as CMS media records and linked from pages, programs and lead magnets."
    />
  );
}
