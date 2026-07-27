import { SettingsEditor } from '@/components/admin/SettingsEditor';
import { adminEmails } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const me = await getSession();
  const configured = adminEmails();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Site Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Site identity, SEO defaults and theme — all editable without code.</p>

      <div className="mt-4 rounded-card border border-slate-200 bg-white p-4 text-sm">
        <p className="text-slate-600">
          Signed in as <strong>{me?.email}</strong> · role <span className="font-semibold text-teal">{me?.role}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {configured.length
            ? `Admin access via ADMIN_EMAILS: ${configured.join(', ')}`
            : 'ADMIN_EMAILS not set — dev fallback grants super-admin to any admin@ address.'}
        </p>
      </div>

      <div className="mt-6">
        <SettingsEditor section="all" />
      </div>
    </div>
  );
}
