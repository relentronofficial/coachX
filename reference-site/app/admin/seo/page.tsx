import { SettingsEditor } from '@/components/admin/SettingsEditor';

export const dynamic = 'force-dynamic';

export default function AdminSeoPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">SEO Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Default meta tags, Open Graph image and robots directive.</p>
      <div className="mt-6">
        <SettingsEditor section="seo" />
      </div>
    </div>
  );
}
