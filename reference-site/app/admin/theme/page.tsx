import { SettingsEditor } from '@/components/admin/SettingsEditor';

export const dynamic = 'force-dynamic';

export default function AdminThemePage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Theme Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Brand colours (logo/favicon assets live under /public/brand).</p>
      <div className="mt-6">
        <SettingsEditor section="theme" />
      </div>
    </div>
  );
}
