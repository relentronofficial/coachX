import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminCategoriesPage() {
  return (
    <ModuleShell
      title="Categories"
      description="Taxonomy for assessments, blogs and content. Categories group questions and content items and drive result logic."
    />
  );
}
