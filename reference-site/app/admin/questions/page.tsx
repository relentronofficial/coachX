import { ModuleShell } from '@/components/admin/ModuleShell';

export const dynamic = 'force-dynamic';

export default function AdminQuestionsPage() {
  return (
    <ModuleShell
      title="Questions"
      description="Assessment questions, options and scores. This module manages the question bank behind Tools/Assessments — each tool's steps become editable records here (create, edit scores, enable/disable, reorder)."
    />
  );
}
